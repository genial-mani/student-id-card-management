export const PAPER_SIZES = {
  A4: { label: "A4 (210 x 297 mm)", widthPx: 2480, heightPx: 3508, widthMm: 210, heightMm: 297 },
  A3: { label: "A3 (297 x 420 mm)", widthPx: 3508, heightPx: 4960, widthMm: 297, heightMm: 420 },
  A2: { label: "A2 (420 x 594 mm)", widthPx: 4960, heightPx: 7016, widthMm: 420, heightMm: 594 },
  A1: { label: "A1 (594 x 841 mm)", widthPx: 7016, heightPx: 9933, widthMm: 594, heightMm: 841 },
  "12x18": { label: "12 x 18 inches", widthPx: 3600, heightPx: 5400, widthMm: 304.8, heightMm: 457.2 },
  "13x19": { label: "13 x 19 inches", widthPx: 3900, heightPx: 5700, widthMm: 330.2, heightMm: 482.6 },
};

export type PaperSize = keyof typeof PAPER_SIZES | "custom";
export type Orientation = "portrait" | "landscape";
export type CustomUnit = "mm" | "in";

export interface PrintSettings {
  paperSize: PaperSize;
  paperOrientation: Orientation;
  documentHorizontal: boolean; 
  gapX?: number;
  gapY?: number;
  customWidthMm?: number;
  customHeightMm?: number;
  customUnit?: CustomUnit;
}

export function getPaperInfo(settings: PrintSettings) {
  if (settings.paperSize === "custom") {
    const unit = settings.customUnit || "mm";
    const rawW = settings.customWidthMm ?? (unit === "in" ? 8.27 : 210);
    const rawH = settings.customHeightMm ?? (unit === "in" ? 11.69 : 297);

    // If unit is inches, convert to mm for internal calculations
    const wMm = unit === "in" ? rawW * 25.4 : rawW;
    const hMm = unit === "in" ? rawH * 25.4 : rawH;

    const MM_TO_PX = 11.8110236; // 300 DPI print resolution
    const label = unit === "in"
      ? `Custom (${rawW} x ${rawH} in)`
      : `Custom (${Math.round(wMm)} x ${Math.round(hMm)} mm)`;

    return {
      label,
      widthPx: Math.round(wMm * MM_TO_PX),
      heightPx: Math.round(hMm * MM_TO_PX),
      widthMm: wMm,
      heightMm: hMm
    };
  }
  return PAPER_SIZES[settings.paperSize as keyof typeof PAPER_SIZES] || PAPER_SIZES.A4;
}

export function calculatePrintGrid(
  settings: PrintSettings,
  docWidthPx: number,
  docHeightPx: number,
  defaultGapPx: number = 24
) {
  const paper = getPaperInfo(settings);
  const MM_TO_PX = 3.7795275591;
  const actualGapX = settings.gapX !== undefined ? settings.gapX * MM_TO_PX : defaultGapPx;
  const actualGapY = settings.gapY !== undefined ? settings.gapY * MM_TO_PX : defaultGapPx;
  
  // Apply paper orientation
  const paperW = settings.paperOrientation === "portrait" ? paper.widthPx : paper.heightPx;
  const paperH = settings.paperOrientation === "portrait" ? paper.heightPx : paper.widthPx;

  const paperWMm = settings.paperOrientation === "portrait" ? paper.widthMm : paper.heightMm;
  const paperHMm = settings.paperOrientation === "portrait" ? paper.heightMm : paper.widthMm;

  // Apply document orientation
  const docW = settings.documentHorizontal ? docHeightPx : docWidthPx;
  const docH = settings.documentHorizontal ? docWidthPx : docHeightPx;

  // Check if it fits at all
  if (docW > paperW || docH > paperH) {
    return {
      fits: false,
      cols: 0,
      rows: 0,
      offsetX: 0,
      offsetY: 0,
      itemsPerPage: 0,
      paperW,
      paperH,
      paperWMm,
      paperHMm,
      docW,
      docH
    };
  }

  // Calculate maximum columns and rows
  const cols = Math.floor((paperW + actualGapX) / (docW + actualGapX));
  const rows = Math.floor((paperH + actualGapY) / (docH + actualGapY));

  const itemsPerPage = cols * rows;

  // Center the grid on the page
  const totalGridW = (cols * docW) + ((cols - 1) * actualGapX);
  const totalGridH = (rows * docH) + ((rows - 1) * actualGapY);

  const offsetX = (paperW - totalGridW) / 2;
  const offsetY = (paperH - totalGridH) / 2;

  return {
    fits: true,
    cols,
    rows,
    offsetX,
    offsetY,
    itemsPerPage,
    paperW,
    paperH,
    paperWMm,
    paperHMm,
    docW,
    docH
  };
}

export function calculatePrintGridMm(
  settings: PrintSettings,
  docWidthMm: number,
  docHeightMm: number,
  defaultGapMm: number = 2
) {
  const paper = getPaperInfo(settings);
  const actualGapX = settings.gapX !== undefined ? settings.gapX : defaultGapMm;
  const actualGapY = settings.gapY !== undefined ? settings.gapY : defaultGapMm;
  
  const paperWMm = settings.paperOrientation === "portrait" ? paper.widthMm : paper.heightMm;
  const paperHMm = settings.paperOrientation === "portrait" ? paper.heightMm : paper.widthMm;

  // Apply document orientation
  const docW = settings.documentHorizontal ? docHeightMm : docWidthMm;
  const docH = settings.documentHorizontal ? docWidthMm : docHeightMm;

  if (docW > paperWMm || docH > paperHMm) {
    return {
      fits: false, cols: 0, rows: 0, offsetX: 0, offsetY: 0,
      itemsPerPage: 0, paperWMm, paperHMm, docW, docH
    };
  }

  const cols = Math.floor((paperWMm + actualGapX) / (docW + actualGapX));
  const rows = Math.floor((paperHMm + actualGapY) / (docH + actualGapY));
  const itemsPerPage = cols * rows;

  const totalGridW = (cols * docW) + ((cols - 1) * actualGapX);
  const totalGridH = (rows * docH) + ((rows - 1) * actualGapY);

  const offsetX = (paperWMm - totalGridW) / 2;
  const offsetY = (paperHMm - totalGridH) / 2;

  return {
    fits: true, cols, rows, offsetX, offsetY, itemsPerPage,
    paperWMm, paperHMm, docW, docH
  };
}
