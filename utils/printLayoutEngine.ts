export const PAPER_SIZES = {
  A4: { label: "A4 (210 x 297 mm)", widthPx: 2480, heightPx: 3508, widthMm: 210, heightMm: 297 },
  A3: { label: "A3 (297 x 420 mm)", widthPx: 3508, heightPx: 4960, widthMm: 297, heightMm: 420 },
  A2: { label: "A2 (420 x 594 mm)", widthPx: 4960, heightPx: 7016, widthMm: 420, heightMm: 594 },
  A1: { label: "A1 (594 x 841 mm)", widthPx: 7016, heightPx: 9933, widthMm: 594, heightMm: 841 },
  "12x18": { label: "12 x 18 inches", widthPx: 3600, heightPx: 5400, widthMm: 304.8, heightMm: 457.2 },
  "13x19": { label: "13 x 19 inches", widthPx: 3900, heightPx: 5700, widthMm: 330.2, heightMm: 482.6 },
};

export type PaperSize = keyof typeof PAPER_SIZES;
export type Orientation = "portrait" | "landscape";

export interface PrintSettings {
  paperSize: PaperSize;
  paperOrientation: Orientation;
  documentHorizontal: boolean; 
}

export function calculatePrintGrid(
  settings: PrintSettings,
  docWidthPx: number,
  docHeightPx: number,
  gapPx: number = 24
) {
  const paper = PAPER_SIZES[settings.paperSize];
  
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
  // Formula: (cols * docW) + ((cols - 1) * gapPx) <= paperW
  // cols * (docW + gapPx) <= paperW + gapPx
  const cols = Math.floor((paperW + gapPx) / (docW + gapPx));
  const rows = Math.floor((paperH + gapPx) / (docH + gapPx));

  const itemsPerPage = cols * rows;

  // Center the grid on the page
  const totalGridW = (cols * docW) + ((cols - 1) * gapPx);
  const totalGridH = (rows * docH) + ((rows - 1) * gapPx);

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
  gapMm: number = 2
) {
  const paper = PAPER_SIZES[settings.paperSize];
  
  const paperWMm = settings.paperOrientation === "portrait" ? paper.widthMm : paper.heightMm;
  const paperHMm = settings.paperOrientation === "portrait" ? paper.heightMm : paper.widthMm;

  const docW = settings.documentHorizontal ? docHeightMm : docWidthMm;
  const docH = settings.documentHorizontal ? docWidthMm : docHeightMm;

  if (docW > paperWMm || docH > paperHMm) {
    return { fits: false, cols: 0, rows: 0, offsetX: 0, offsetY: 0, itemsPerPage: 0, paperWMm, paperHMm, docW, docH };
  }

  const cols = Math.floor((paperWMm + gapMm) / (docW + gapMm));
  const rows = Math.floor((paperHMm + gapMm) / (docH + gapMm));
  const itemsPerPage = cols * rows;

  const totalGridW = (cols * docW) + ((cols - 1) * gapMm);
  const totalGridH = (rows * docH) + ((rows - 1) * gapMm);

  const offsetX = (paperWMm - totalGridW) / 2;
  const offsetY = (paperHMm - totalGridH) / 2;

  return { fits: true, cols, rows, offsetX, offsetY, itemsPerPage, paperWMm, paperHMm, docW, docH };
}
