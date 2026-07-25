/**
 * canvasCardRenderer.ts
 * ═══════════════════════════════════════════════════════
 * Pure Canvas 2D card renderer for PDF generation.
 *
 * Replicates the visual output of the IdCard React component
 * without any DOM dependencies.  Used exclusively for PDF output;
 * the React IdCard component is kept unchanged for on-screen preview.
 */

import { PRESET_LAYOUT_CONFIGS } from "@/utils/presetLayouts";
import type { CardTheme } from "@/components/IdCard";
import layout10Bg from "@/assets/idcard-layout-10.jpeg";
import layout11Bg from "@/assets/id-card-layout-11.jpeg";
import layout12Bg from "@/assets/id-card-layout-12.jpeg";

// ─── Constants ──────────────────────────────────────────────────────────────────

const CARD_W = 673;
const CARD_H = 1087;
const LINE_HEIGHT = 1.25; // matches Tailwind "leading-tight"

/** Safely extract the `.src` URL from a Next.js static image import. */
function srcOf(imported: any): string {
  if (typeof imported === "string") return imported;
  return imported?.src ?? imported?.default?.src ?? imported?.default ?? "";
}

const LAYOUT_BG_SRC: Record<number, string> = {
  10: srcOf(layout10Bg),
  11: srcOf(layout11Bg),
  12: srcOf(layout12Bg),
};

// ─── Public types ───────────────────────────────────────────────────────────────

export type ImageCache = Map<string, HTMLImageElement>;

export interface SchoolLike {
  name: string;
  caption?: string;
  address?: string;
  logoUrl: string;
  signatureUrl?: string;
  phone?: string;
  customValues?: any;
  idCardLayoutConfig?: any;
}

export interface StudentLike {
  name: string;
  fatherName?: string;
  fatherPhone?: string;
  address?: string;
  profilePictureUrl?: string;
  idNo?: string;
  camSno?: string;
  motherName?: string;
  motherPhone?: string;
  customValues?: any;
}

// ─── Image pre-fetching ─────────────────────────────────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.warn("Image load failed:", url, e);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Pre-fetch every unique image URL the print run will need.
 * Returns a `Map<url, HTMLImageElement>` for O(1) lookup during draw.
 */
export async function prefetchImages(
  school: SchoolLike,
  students: StudentLike[],
  layout: number,
  layoutConfig: any,
): Promise<ImageCache> {
  const urls = new Set<string>();

  if (school.logoUrl) urls.add(school.logoUrl);
  if (school.signatureUrl) urls.add(school.signatureUrl);
  for (const s of students) {
    if (s.profilePictureUrl) urls.add(s.profilePictureUrl);
  }

  // Preset layout background images (10-12)
  const bgSrc = LAYOUT_BG_SRC[layout];
  if (bgSrc) urls.add(bgSrc);

  // Custom / shared layout background
  let parsed = layoutConfig;
  if (typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } catch { parsed = null; }
  }
  if ((layout === 0 || layout >= 13) && parsed?.backgroundUrl) {
    urls.add(parsed.backgroundUrl);
  }

  const cache: ImageCache = new Map();
  const results = await Promise.allSettled(
    Array.from(urls).map(async (url) => ({ url, img: await loadImage(url) })),
  );
  for (const r of results) {
    if (r.status === "fulfilled") cache.set(r.value.url, r.value.img);
  }
  return cache;
}

// ─── Field text resolution ──────────────────────────────────────────────────────

function parseCV(raw: any): any {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
}

function resolveField(
  key: string,
  school: SchoolLike,
  student: StudentLike,
  classNameStr: string,
  classCustomValues: any,
): { text: string; label: string } {
  let text = "";
  let label = "";

  if (key === "school_name") {
    text = school.name;
  } else if (key === "school_caption") {
    text = school.caption || "";
  } else if (key === "school_address") {
    text = school.address || "";
  } else if (key === "school_phone") {
    text = school.phone || "";
  } else if (key === "student_name") {
    text = student.name;
  } else if (key === "class_name") {
    text = classNameStr;
    label = "Class: ";
  } else if (key === "student_idNo") {
    text = student.idNo || "";
    label = "ID No: ";
  } else if (key === "student_camSno") {
    text = student.camSno || "";
    label = "CAM S.No: ";
  } else if (key === "student_fatherName") {
    text = student.fatherName || "";
    label = "F's Name: ";
  } else if (key === "student_motherName") {
    const cv = parseCV(student.customValues);
    text = (student as any).motherName || cv?.motherName || cv?.mother_name || "";
    label = "M's Name: ";
  } else if (key === "student_fatherPhone") {
    text = student.fatherPhone || "";
    label = "Cell: ";
  } else if (key === "student_motherPhone") {
    const cv = parseCV(student.customValues);
    text = (student as any).motherPhone || cv?.motherPhone || cv?.mother_phone || "";
    label = "Cell: ";
  } else if (key === "student_address") {
    text = student.address || "";
    label = "Address: ";
  } else if (key.startsWith("student_custom_")) {
    const k = key.replace("student_custom_", "");
    const cv = parseCV(student.customValues);
    text = cv?.[k] || "";
    label = `${k.charAt(0).toUpperCase() + k.slice(1)}: `;
  } else if (key.startsWith("school_custom_")) {
    const k = key.replace("school_custom_", "");
    const cv = parseCV(school.customValues);
    text = cv?.[k] || "";
    label = `${k.charAt(0).toUpperCase() + k.slice(1)}: `;
  } else if (key.startsWith("class_custom_")) {
    const k = key.replace("class_custom_", "");
    const cv = parseCV(classCustomValues);
    text = cv?.[k] || "";
    label = `${k.charAt(0).toUpperCase() + k.slice(1)}: `;
  }

  return { text, label };
}

// ─── Background shapes ─────────────────────────────────────────────────────────
// Each case replicates the CSS/Tailwind shape from IdCard.tsx via Canvas 2D.

function drawLayoutBg(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  layout: number,
  theme: CardTheme,
  imageCache: ImageCache,
  layoutConfig: any,
): void {
  const W = CARD_W;
  const H = CARD_H;

  // Custom / shared layouts – draw background image if available
  if (layout === 0 || layout >= 13) {
    let parsed = layoutConfig;
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch { parsed = null; }
    }
    if (parsed?.backgroundUrl) {
      const img = imageCache.get(parsed.backgroundUrl);
      if (img) ctx.drawImage(img, ox, oy, W, H);
    }
    return;
  }

  switch (layout) {
    case 1: {
      // Primary h-85 (340 px) with rounded-b-[50%]
      const h = 340;
      const ry = h / 2; // 170
      ctx.save();
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + W, oy);
      ctx.lineTo(ox + W, oy + ry);
      // Bottom half-ellipse from right → left through bottom
      ctx.ellipse(ox + W / 2, oy + ry, W / 2, ry, 0, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case 2: {
      // Primary h-100 (400 px), polygon(0 0, 100% 0, 100% 60%, 0 100%)
      const h = 400;
      ctx.save();
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + W, oy);
      ctx.lineTo(ox + W, oy + h * 0.6);
      ctx.lineTo(ox, oy + h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case 3: {
      // Border inset-9 (36 px), 6 px stroke in primary
      ctx.save();
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 6;
      ctx.strokeRect(ox + 36, oy + 36, W - 72, H - 72);
      ctx.restore();
      break;
    }
    case 4: {
      // Left strip w-20 (80 px) full height
      ctx.fillStyle = theme.primary;
      ctx.fillRect(ox, oy, 80, H);
      break;
    }
    case 5: {
      // Top 50 % primary, bottom 50 % secondary
      const mid = H / 2;
      ctx.fillStyle = theme.primary;
      ctx.fillRect(ox, oy, W, mid);
      ctx.fillStyle = theme.secondary;
      ctx.fillRect(ox, oy + mid, W, H - mid);
      break;
    }
    case 6: {
      // Bottom dome h-87.5 (350 px) with rounded-t-[50%]
      const h = 350;
      const ry = h / 2; // 175
      const cy = oy + H - h + ry; // dome centre y
      ctx.save();
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      // Top half-ellipse from left → right through top (counterclockwise)
      ctx.ellipse(ox + W / 2, cy, W / 2, ry, 0, Math.PI, 0, true);
      ctx.lineTo(ox + W, oy + H);
      ctx.lineTo(ox, oy + H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case 7: {
      // Top h-50 (200 px) primary, bottom h-37.5 (150 px) secondary
      ctx.fillStyle = theme.primary;
      ctx.fillRect(ox, oy, W, 200);
      ctx.fillStyle = theme.secondary;
      ctx.fillRect(ox, oy + H - 150, W, 150);
      break;
    }
    case 8: {
      // Top half angled: polygon(0 0, 100% 0, 100% 100%, 0 80%)
      const mid = H / 2;
      ctx.save();
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + W, oy);
      ctx.lineTo(ox + W, oy + mid);
      ctx.lineTo(ox, oy + mid * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // Bottom half angled: polygon(0 20%, 100% 0, 100% 100%, 0 100%)
      ctx.save();
      ctx.fillStyle = theme.secondary;
      ctx.beginPath();
      ctx.moveTo(ox, oy + mid + mid * 0.2);
      ctx.lineTo(ox + W, oy + mid);
      ctx.lineTo(ox + W, oy + H);
      ctx.lineTo(ox, oy + H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case 9: {
      // Triangle top-right w-80 h-80 (320 px)
      const s = 320;
      ctx.save();
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.moveTo(ox + W, oy);
      ctx.lineTo(ox + W - s, oy);
      ctx.lineTo(ox + W, oy + s);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case 10:
    case 11:
    case 12: {
      const src = LAYOUT_BG_SRC[layout];
      if (src) {
        const img = imageCache.get(src);
        if (img) ctx.drawImage(img, ox, oy, W, H);
      }
      break;
    }
  }
}

// ─── Text helpers ───────────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (maxWidth <= 0) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function font(weight: string | number, size: number, family: string): string {
  return `${weight} ${size}px ${family}`;
}

// ─── Rounded-rect clip (for student_photo borderRadius) ─────────────────────────

function clipRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  radius: string | number,
): void {
  let r: number;
  if (typeof radius === "string") {
    r = radius.endsWith("%")
      ? (Math.min(w, h) * parseFloat(radius)) / 100
      : parseFloat(radius) || 0;
  } else {
    r = radius;
  }
  r = Math.min(r, w / 2, h / 2);
  if (r <= 0) return;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.clip();
}

// ─── Inner text rendering ───────────────────────────────────────────────────────

function renderText(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  label: string,
  f: any,
  fontSize: number,
  fontWeight: string,
  fontFamily: string,
  fieldWidth: number,
  align: CanvasTextAlign,
  isMultiline: boolean,
  fieldXInCard: number,
): void {
  const lineH = fontSize * LINE_HEIGHT;
  const showLabel = f.labelVisible !== false && !!label;

  // Determine anchor position from alignment
  const fieldX = f.x || 0;
  let targetXInCard = fieldX;
  if (align === "center") {
    targetXInCard = fieldWidth > 0 ? fieldX + fieldWidth / 2 : (fieldX >= 0 && fieldX < CARD_W / 2 ? CARD_W / 2 : fieldX);
  } else if (align === "right") {
    targetXInCard = fieldWidth > 0 ? fieldX + fieldWidth : fieldX;
  }

  let anchorX: number;
  if (x === 0 && (f.scaleX !== 1 || f.scaleY !== 1)) {
    anchorX = targetXInCard - fieldX;
  } else {
    const cardOriginX = x - fieldX;
    anchorX = cardOriginX + targetXInCard;
  }

  const canvasAlign: CanvasTextAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
  const fieldH = f.height || 0;
  const strokeW = f.strokeWidth || 0;
  const strokeC = f.strokeColor || "#ffffff";

  // Helper to draw text with optional outer stroke outline
  const drawTextWithStroke = (txt: string, tx: number, ty: number) => {
    if (strokeW > 0) {
      ctx.save();
      ctx.strokeStyle = strokeC;
      ctx.lineWidth = strokeW * 2;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(txt, tx, ty);
      ctx.restore();
    }
    ctx.fillText(txt, tx, ty);
  };

  // Use middle textBaseline for true flex-style vertical centering (align-items: center)
  ctx.textBaseline = "middle";

  if (!isMultiline) {
    // Single-line text vertical center
    const drawY = fieldH > 0 ? y + fieldH / 2 : y + lineH / 2;

    // ── Single-line ──
    if (showLabel && canvasAlign === "left") {
      // Label (bold, 85 % opacity) then value
      ctx.font = font("700", fontSize, fontFamily);
      ctx.textAlign = "left";
      ctx.globalAlpha = 0.85;
      drawTextWithStroke(label, anchorX, drawY);
      const lw = ctx.measureText(label).width;
      ctx.globalAlpha = 1;
      ctx.font = font(fontWeight, fontSize, fontFamily);
      drawTextWithStroke(text, anchorX + lw + 4, drawY); // 4 px ≈ mr-1
    } else if (showLabel) {
      // Centre / right aligned: measure total width, position manually
      ctx.font = font("700", fontSize, fontFamily);
      const lw = ctx.measureText(label).width;
      ctx.font = font(fontWeight, fontSize, fontFamily);
      const vw = ctx.measureText(text).width;
      const total = lw + 4 + vw;
      const startX = canvasAlign === "center" ? anchorX - total / 2 : anchorX - total;

      ctx.textAlign = "left";
      ctx.font = font("700", fontSize, fontFamily);
      ctx.globalAlpha = 0.85;
      drawTextWithStroke(label, startX, drawY);
      ctx.globalAlpha = 1;
      ctx.font = font(fontWeight, fontSize, fontFamily);
      drawTextWithStroke(text, startX + lw + 4, drawY);
    } else {
      ctx.font = font(fontWeight, fontSize, fontFamily);
      ctx.textAlign = canvasAlign;
      drawTextWithStroke(text, anchorX, drawY);
    }
  } else {
    // ── Multiline with word-wrap ──
    const maxW = fieldWidth > 0 ? fieldWidth : CARD_W - fieldXInCard;
    const full = showLabel ? label + text : text;
    ctx.font = font(fontWeight, fontSize, fontFamily);
    ctx.textAlign = canvasAlign;
    const lines = wrapText(ctx, full, maxW);

    const totalH = lines.length * lineH;
    const startTopY = fieldH > totalH ? y + (fieldH - totalH) / 2 : y;

    for (let i = 0; i < lines.length; i++) {
      drawTextWithStroke(lines[i], anchorX, startTopY + (i + 0.5) * lineH);
    }
  }
}

// ─── Main draw function ─────────────────────────────────────────────────────────

/**
 * Draw a single ID card at position (ox, oy) on the given canvas context.
 * Faithfully replicates IdCard.tsx layout backgrounds, field placement,
 * image rendering, text styling, and label prefixes.
 */
export function drawCardOnCanvas(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  school: SchoolLike,
  student: StudentLike,
  classNameStr: string,
  classCustomValues: any,
  layout: number,
  theme: CardTheme,
  layoutConfig: any,
  imageCache: ImageCache,
): void {
  ctx.save();

  // Clip to card boundary (overflow: hidden)
  ctx.beginPath();
  ctx.rect(ox, oy, CARD_W, CARD_H);
  ctx.clip();

  // 1. Card background fill
  ctx.fillStyle = theme.background;
  ctx.fillRect(ox, oy, CARD_W, CARD_H);

  // 2. Layout decorative background
  drawLayoutBg(ctx, ox, oy, layout, theme, imageCache, layoutConfig);

  // 3. Thin black border (matches CSS border: 0.1px solid black)
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(ox + 0.25, oy + 0.25, CARD_W - 0.5, CARD_H - 0.5);

  // 4. Resolve fields config (same logic as IdCard.tsx)
  let parsedConfig = layoutConfig;
  if (typeof parsedConfig === "string") {
    try { parsedConfig = JSON.parse(parsedConfig); } catch { parsedConfig = null; }
  }
  let fields = parsedConfig?.fields;
  if ((!fields || Object.keys(fields).length === 0) && layout >= 1 && layout <= 12) {
    fields = PRESET_LAYOUT_CONFIGS[layout]?.fields || {};
  }
  fields = fields || {};

  // 5. Draw each visible field
  for (const [key, f] of Object.entries<any>(fields)) {
    if (!f || !f.visible) continue;

    const fx = ox + (f.x || 0);
    const fy = oy + (f.y || 0);
    const fw: number = f.width || 0;
    const fh: number = f.height || 0;
    const fontSize: number = f.fontSize || 16;
    const fontWeight = String(f.fontWeight || "normal");
    const fontFamily = f.fontFamily ? `'${f.fontFamily}', sans-serif` : "sans-serif";
    const color: string = f.color || "#000000";
    const align = (f.align || "left") as CanvasTextAlign;
    const scaleX: number = f.scaleX || 1;
    const scaleY: number = f.scaleY || 1;

    // ── Image fields ──────────────────────────────────────────────────────────
    if (key === "school_logo" || key === "principal_signature" || key === "student_photo") {
      let url: string | undefined;
      if (key === "school_logo") url = school.logoUrl;
      else if (key === "principal_signature") url = school.signatureUrl;
      else url = student.profilePictureUrl;

      if (url && fw && fh) {
        const img = imageCache.get(url);
        if (img) {
          ctx.save();
          if (scaleX !== 1 || scaleY !== 1) {
            ctx.translate(fx, fy);
            ctx.scale(scaleX, scaleY);
            if (key === "student_photo" && f.borderRadius && f.borderRadius !== "0") {
              clipRoundedRect(ctx, 0, 0, fw, fh, f.borderRadius);
            }
            ctx.drawImage(img, 0, 0, fw, fh);
          } else {
            if (key === "student_photo" && f.borderRadius && f.borderRadius !== "0") {
              clipRoundedRect(ctx, fx, fy, fw, fh, f.borderRadius);
            }
            ctx.drawImage(img, fx, fy, fw, fh);
          }
          ctx.restore();
        }
      }
      continue;
    }

    // ── Text fields ───────────────────────────────────────────────────────────
    const { text, label } = resolveField(key, school, student, classNameStr, classCustomValues);
    if (!text) continue;

    const isMultiline =
      key === "school_address" || key === "student_address" ||
      key === "school_name" || key === "school_caption";

    ctx.save();
    ctx.fillStyle = color;

    if (scaleX !== 1 || scaleY !== 1) {
      ctx.translate(fx, fy);
      ctx.scale(scaleX, scaleY);
      renderText(ctx, 0, 0, text, label, f, fontSize, fontWeight, fontFamily, fw, align, isMultiline, f.x || 0);
    } else {
      renderText(ctx, fx, fy, text, label, f, fontSize, fontWeight, fontFamily, fw, align, isMultiline, f.x || 0);
    }

    ctx.restore();
  }

  ctx.restore(); // outer clip
}
