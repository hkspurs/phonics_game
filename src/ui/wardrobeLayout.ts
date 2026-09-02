export interface WardrobeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WardrobeLayout {
  header: WardrobeRect;
  items: WardrobeRect;
  preview: WardrobeRect;
  stage: WardrobeRect;
  character: WardrobeRect & { scale: number };
  details: WardrobeRect;
  action: WardrobeRect;
  compact: boolean;
}

export function getWardrobeLayout(width: number, height: number, compactOverride?: boolean): WardrobeLayout {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const compact = compactOverride ?? (w < 1000 || h < 620);
  const margin = compact ? Math.max(10, w * 0.015) : Math.max(18, w * 0.018);
  const gap = compact ? Math.max(8, w * 0.01) : Math.max(12, w * 0.014);
  const headerHeight = compact ? Math.min(54, h * 0.14) : Math.min(62, h * 0.09);
  const contentY = margin + headerHeight + gap * 0.5;
  const contentHeight = Math.max(1, h - contentY - margin * 0.6);
  const contentWidth = Math.max(1, w - margin * 2);
  const itemsWidth = Math.max(1, Math.floor((contentWidth - gap) * 0.4));
  const previewX = margin + itemsWidth + gap;
  const previewWidth = Math.max(1, w - previewX - margin);
  const preview = { x: previewX, y: contentY, width: previewWidth, height: contentHeight };

  const actionHeight = compact ? Math.min(52, Math.max(46, h * 0.08)) : Math.min(68, Math.max(64, h * 0.09));
  const action = {
    x: preview.x + Math.min(18, preview.width * 0.04),
    y: h - actionHeight - Math.max(10, margin * 0.6),
    width: Math.max(1, preview.width - Math.min(36, preview.width * 0.08)),
    height: actionHeight,
  };
  const detailsHeight = compact
    ? Math.min(96, Math.max(84, h * 0.14))
    : Math.min(116, Math.max(105, h * 0.16));
  const details = {
    x: action.x,
    y: Math.max(preview.y + 1, action.y - detailsHeight - (compact ? 6 : 8)),
    width: action.width,
    height: detailsHeight,
  };
  const stage = {
    x: preview.x + Math.min(12, preview.width * 0.03),
    y: preview.y + Math.min(10, preview.height * 0.02),
    width: Math.max(1, preview.width - Math.min(24, preview.width * 0.06)),
    height: Math.max(1, details.y - preview.y - Math.min(12, preview.height * 0.03)),
  };
  const characterHeight = Math.max(
    1,
    preview.height * 0.75
  );
  const characterWidth = Math.max(1, Math.min(stage.width - 12, characterHeight * 0.72));
  const character = {
    x: stage.x + (stage.width - characterWidth) / 2,
    y: preview.y + (preview.height - characterHeight) / 2,
    width: characterWidth,
    height: characterHeight,
    scale: compact ? 1.35 : 1.55,
  };

  return {
    header: { x: margin, y: margin * 0.45, width: contentWidth, height: headerHeight },
    items: { x: margin, y: contentY, width: itemsWidth, height: contentHeight },
    preview,
    stage,
    character,
    details,
    action,
    compact,
  };
}
