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
import { getCardDimensionsMm } from "@/utils/printLayoutEngine";
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

async function loadImage(url: string): Promise<HTMLImageElement> {
  if (!url || typeof url !== "string") throw new Error("Invalid URL");

  // Normalize protocol-relative URL
  let targetUrl = url.trim();
  if (targetUrl.startsWith("//")) {
    targetUrl = `https:${targetUrl}`;
  }

  // 1. Try fetching as Blob first (bypasses Chrome CORS disk cache poisoning)
  try {
    const res = await fetch(targetUrl, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = objectUrl;
      });
    }
  } catch (err) {
    console.warn("Fetch blob failed for image, trying cache-buster Image load:", targetUrl, err);
  }

  // 2. Try direct Image load with crossOrigin = "anonymous" and cache buster
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      const cacheBustUrl = targetUrl.includes("?")
        ? `${targetUrl}&_cb=${Date.now()}`
        : `${targetUrl}?_cb=${Date.now()}`;
      img.src = cacheBustUrl;
    });
  } catch (err) {
    console.warn("Cache-buster Image load failed, trying direct anonymous Image load:", targetUrl, err);
  }

  // 3. Try direct Image load with crossOrigin = "anonymous"
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = targetUrl;
    });
  } catch (err) {
    console.warn("Anonymous Image load failed, trying non-CORS fallback:", targetUrl, err);
  }

  // 4. Fallback: direct Image load without crossOrigin
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error("All image load attempts failed for:", targetUrl, e);
      reject(e);
    };
    img.src = targetUrl;
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
    let photoUrl = s.profilePictureUrl;
    if (!photoUrl && (s as any).photoUrl) photoUrl = (s as any).photoUrl;
    if (!photoUrl && (s as any).profilePic) photoUrl = (s as any).profilePic;
    if (!photoUrl && s.customValues) {
      const cv = parseCV(s.customValues);
      photoUrl = cv?.profilePictureUrl || cv?.photoUrl || cv?.profilePic;
    }
    if (photoUrl) urls.add(photoUrl);
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
  const urlList = Array.from(urls);

  const results = await Promise.allSettled(
    urlList.map(async (url) => {
      const img = await loadImage(url);
      return { url, img };
    }),
  );

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const originalUrl = urlList[i];
    if (r.status === "fulfilled") {
      const img = r.value.img;
      cache.set(originalUrl, img);
      if (originalUrl.startsWith("//")) {
        cache.set(`https:${originalUrl}`, img);
      }
      const cleanUrl = originalUrl.split("?")[0];
      if (!cache.has(cleanUrl)) {
        cache.set(cleanUrl, img);
      }
    } else {
      console.warn("Could not prefetch image for PDF rendering:", originalUrl, r.reason);
    }
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
  cardWidthPx: number = CARD_W,
  cardHeightPx: number = CARD_H,
): void {
  const W = cardWidthPx;
  const H = cardHeightPx;

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

// ─── Image object-fit cover helper ─────────────────────────────────────────────

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  if (!imgW || !imgH || !w || !h) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }

  const imgRatio = imgW / imgH;
  const targetRatio = w / h;

  let sx = 0;
  let sy = 0;
  let sw = imgW;
  let sh = imgH;

  if (imgRatio > targetRatio) {
    sw = imgH * targetRatio;
    sx = (imgW - sw) / 2;
  } else {
    sh = imgW / targetRatio;
    sy = (imgH - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// ─── Text helpers ───────────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  preserveNewlines: boolean = false,
): string[] {
  if (!text) return [""];
  if (!preserveNewlines) {
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

  const paragraphs = text.split(/\r?\n/);
  if (maxWidth <= 0) return paragraphs;

  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let line = "";
    for (const w of words) {
      if (!w) continue;
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    else if (words.length === 0 || para === "") lines.push("");
  }
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

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  radius: string | number,
  lineWidth: number
): void {
  let r: number;
  if (typeof radius === "string") {
    r = radius.endsWith("%")
      ? (Math.min(w, h) * parseFloat(radius)) / 100
      : parseFloat(radius) || 0;
  } else {
    r = radius || 0;
  }
  r = Math.min(r, w / 2, h / 2);

  ctx.save();
  ctx.beginPath();
  if (r <= 0) {
    ctx.rect(x, y, w, h);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
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
  fieldKey: string = "",
): void {
  const lineH = fontSize * LINE_HEIGHT;
  const showLabel = f.labelVisible !== false && !!label;
  const isAddress = fieldKey === "school_address" || fieldKey === "student_address";

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
  const textFillColor = f.color || "#000000";

  // Helper to draw text with optional outer stroke outline
  const drawTextWithStroke = (txt: string, tx: number, ty: number) => {
    if (strokeW > 0 && strokeC.toLowerCase() !== textFillColor.toLowerCase() && strokeC !== "transparent") {
      ctx.save();
      ctx.strokeStyle = strokeC;
      ctx.lineWidth = strokeW;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(txt, tx, ty);
      ctx.restore();
    }
    ctx.fillText(txt, tx, ty);
  };

  // Use middle textBaseline for true flex-style vertical centering (align-items: center)
  ctx.textBaseline = "middle";

  const vertAlign = f.verticalAlign || "center";

  if (!isMultiline) {
    // Single-line text vertical position
    const drawY = vertAlign === "top"
      ? y + lineH / 2
      : vertAlign === "bottom" && fieldH > 0
        ? y + fieldH - lineH / 2
        : fieldH > 0
          ? y + fieldH / 2
          : y + lineH / 2;

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
    const lines = wrapText(ctx, full, maxW, isAddress);

    ctx.save();
    if (fieldH > 0) {
      ctx.beginPath();
      const clipX = canvasAlign === "center" ? anchorX - maxW / 2 : canvasAlign === "right" ? anchorX - maxW : anchorX;
      ctx.rect(clipX, y, maxW, fieldH);
      ctx.clip();
    }

    const totalH = lines.length * lineH;
    const startTopY = vertAlign === "top" || fieldH <= totalH
      ? y
      : vertAlign === "bottom"
        ? y + fieldH - totalH
        : y + (fieldH - totalH) / 2;

    for (let i = 0; i < lines.length; i++) {
      const lineY = startTopY + (i + 0.5) * lineH;
      if (fieldH > 0 && (i * lineH) >= fieldH) break;
      drawTextWithStroke(lines[i], anchorX, lineY);
    }
    ctx.restore();
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
  const { widthMm: cardWMm, heightMm: cardHMm, widthPx: cardWidthPx, heightPx: cardHeightPx } = getCardDimensionsMm(layoutConfig);

  ctx.save();

  // Clip to card boundary (overflow: hidden)
  ctx.beginPath();
  ctx.rect(ox, oy, cardWidthPx, cardHeightPx);
  ctx.clip();

  // 1. Card background fill
  ctx.fillStyle = theme.background;
  ctx.fillRect(ox, oy, cardWidthPx, cardHeightPx);

  // 2. Layout decorative background
  drawLayoutBg(ctx, ox, oy, layout, theme, imageCache, layoutConfig, cardWidthPx, cardHeightPx);

  // 3. Thin black border (matches CSS border: 0.1px solid black)
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(ox + 0.25, oy + 0.25, cardWidthPx - 0.5, cardHeightPx - 0.5);

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
      if (key === "school_logo") {
        url = school.logoUrl;
      } else if (key === "principal_signature") {
        url = school.signatureUrl;
      } else {
        url = student.profilePictureUrl || (student as any).photoUrl || (student as any).profilePic;
        if (!url && student.customValues) {
          const cv = parseCV(student.customValues);
          url = cv?.profilePictureUrl || cv?.photoUrl || cv?.profilePic;
        }
      }

      const presetField = PRESET_LAYOUT_CONFIGS[layout]?.fields?.[key];

      let rawW = f.width !== undefined && f.width !== null ? (typeof f.width === "number" ? f.width : parseFloat(f.width)) : NaN;
      let rawH = f.height !== undefined && f.height !== null ? (typeof f.height === "number" ? f.height : parseFloat(f.height)) : NaN;

      let presetW = presetField?.width !== undefined ? presetField.width : NaN;
      let presetH = presetField?.height !== undefined ? presetField.height : NaN;

      let targetUrl = url ? (url.startsWith("//") ? `https:${url}` : url) : "";
      let img = targetUrl ? (imageCache.get(targetUrl) || imageCache.get(url!) || imageCache.get(url!.split("?")[0])) : undefined;

      if (!img && targetUrl) {
        const cleanUrl = targetUrl.split("?")[0];
        for (const [cacheKey, cacheImg] of imageCache.entries()) {
          if (cacheKey.split("?")[0] === cleanUrl) {
            img = cacheImg;
            break;
          }
        }
      }

      // Calculate natural image aspect ratio if image is loaded
      const naturalW = img ? (img.naturalWidth || img.width || 0) : 0;
      const naturalH = img ? (img.naturalHeight || img.height || 0) : 0;
      const imgAspect = naturalW > 0 && naturalH > 0 ? naturalW / naturalH : 1;

      let imageW: number;
      let imageH: number;

      if (!isNaN(rawW) && rawW > 0 && !isNaN(rawH) && rawH > 0) {
        imageW = rawW;
        imageH = rawH;
      } else if (!isNaN(rawW) && rawW > 0) {
        imageW = rawW;
        imageH = !isNaN(presetH) && presetH > 0 ? presetH : (imgAspect > 0 ? Math.round(rawW / imgAspect) : rawW);
      } else if (!isNaN(rawH) && rawH > 0) {
        imageH = rawH;
        imageW = !isNaN(presetW) && presetW > 0 ? presetW : (imgAspect > 0 ? Math.round(rawH * imgAspect) : rawH);
      } else if (!isNaN(presetW) && presetW > 0 && !isNaN(presetH) && presetH > 0) {
        imageW = presetW;
        imageH = presetH;
      } else {
        // Full auto state: fallback to default size or natural dimensions
        if (key === "student_photo") {
          imageW = naturalW > 0 ? naturalW : 288;
          imageH = naturalH > 0 ? naturalH : 288;
        } else if (key === "school_logo") {
          imageW = naturalW > 0 ? naturalW : 96;
          imageH = naturalH > 0 ? naturalH : 96;
        } else if (key === "principal_signature") {
          imageW = naturalW > 0 ? naturalW : 150;
          imageH = naturalH > 0 ? naturalH : 80;
        } else {
          imageW = 0;
          imageH = 0;
        }
      }

      // Calculate horizontal positioning according to align setting
      let imageX = f.x || 0;
      if (align === "center") {
        const centerX = f.width ? f.x + f.width / 2 : (f.x > 0 && f.x < CARD_W / 2 ? CARD_W / 2 : f.x);
        imageX = centerX - imageW / 2;
      } else if (align === "right") {
        const rightX = f.width ? f.x + f.width : f.x;
        imageX = rightX - imageW;
      }

      const imgFx = ox + imageX;

      const imgBorderWidth = typeof f.borderWidth === "number" ? f.borderWidth : (parseFloat(f.borderWidth) || 0);
      const imgBorderColor = f.borderColor || "#000000";
      const imgRadius = f.borderRadius || "0";

      if (url && imageW > 0 && imageH > 0) {
        if (img) {
          ctx.save();
          if (scaleX !== 1 || scaleY !== 1) {
            ctx.translate(imgFx, fy);
            ctx.scale(scaleX, scaleY);
            if (imgRadius && imgRadius !== "0") {
              clipRoundedRect(ctx, 0, 0, imageW, imageH, imgRadius);
            }
            drawCoverImage(ctx, img, 0, 0, imageW, imageH);

            if (imgBorderWidth > 0) {
              ctx.strokeStyle = imgBorderColor;
              strokeRoundedRect(ctx, 0, 0, imageW, imageH, imgRadius, imgBorderWidth);
            }
          } else {
            if (imgRadius && imgRadius !== "0") {
              clipRoundedRect(ctx, imgFx, fy, imageW, imageH, imgRadius);
            }
            drawCoverImage(ctx, img, imgFx, fy, imageW, imageH);

            if (imgBorderWidth > 0) {
              ctx.strokeStyle = imgBorderColor;
              strokeRoundedRect(ctx, imgFx, fy, imageW, imageH, imgRadius, imgBorderWidth);
            }
          }
          ctx.restore();
        }
      }
      continue;
    }

    // ── Text fields ───────────────────────────────────────────────────────────
    let { text, label } = resolveField(key, school, student, classNameStr, classCustomValues);
    if (!text) continue;

    const isSingleLine = f.addressFormat === "singleline_space" || f.addressFormat === "singleline_comma" || f.addressFormat === "singleline";
    if (isSingleLine && typeof text === "string") {
      if (f.addressFormat === "singleline_comma") {
        text = text.replace(/[\r\n]+/g, ", ").replace(/,\s*,/g, ",").trim();
      } else {
        text = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
      }
    }

    const isMultiline = !isSingleLine && (
      fw > 0 ||
      key === "school_address" || key === "student_address" ||
      key === "school_name" || key === "school_caption"
    );

    ctx.save();
    ctx.fillStyle = color;

    if (scaleX !== 1 || scaleY !== 1) {
      ctx.translate(fx, fy);
      ctx.scale(scaleX, scaleY);
      renderText(ctx, 0, 0, text, label, f, fontSize, fontWeight, fontFamily, fw, align, isMultiline, f.x || 0, key);
    } else {
      renderText(ctx, fx, fy, text, label, f, fontSize, fontWeight, fontFamily, fw, align, isMultiline, f.x || 0, key);
    }

    ctx.restore();
  }

  ctx.restore(); // outer clip
}
