export class TextLayout {
  constructor(data = {}) {
    this.font = String(data.font ?? "14px sans-serif");
    this.lines = Array.isArray(data.lines) ? data.lines : [];
    this.rawLineHeight = Number(data.rawLineHeight ?? data.lineHeight ?? 0) || 0;
    this.lineGap = Number(data.lineGap ?? 0) || 0;
    this.lineAdvance = Number(data.lineAdvance ?? (this.rawLineHeight + this.lineGap)) || 0;
    this.lineHeight = Number(data.lineHeight ?? this.rawLineHeight) || 0;
    this.maxLineWidth = Number(data.maxLineWidth ?? 0) || 0;

    const lineCount = this.lines.length;
    this.totalHeight = lineCount <= 0
      ? 0
      : (this.rawLineHeight * lineCount) + (this.lineGap * Math.max(0, lineCount - 1));
  }

  getLineForIndex(index) {
    if (!Array.isArray(this.lines) || this.lines.length === 0) return null;

    for (const line of this.lines) {
      if (index >= line.startIndex && index <= line.endIndex) {
        return line;
      }
    }

    return this.lines[this.lines.length - 1] ?? null;
  }

  getCaretPosition(index) {
    const line = this.getLineForIndex(index);
    if (!line) return { x: 0, y: 0 };

    const lineIndex = this.lines.indexOf(line);
    const offset = Math.max(0, index - line.startIndex);
    const charWidths = line.charWidths ?? [];

    let x = 0;
    for (let i = 0; i < offset; i++) {
      x += charWidths[i] ?? 0;
    }

    return { x, y: lineIndex * this.lineHeight };
  }

  getIndexFromPosition(x, y) {
    if (!Array.isArray(this.lines) || this.lines.length === 0) {
      return 0;
    }

    const rawLineIndex = Math.floor(y / Math.max(1, this.lineHeight));
    const lineIndex = Math.max(0, Math.min(rawLineIndex, this.lines.length - 1));
    const line = this.lines[lineIndex];

    if (!line) {
      return this.lines[this.lines.length - 1]?.endIndex ?? 0;
    }

    const charWidths = line.charWidths ?? [];
    let currentX = 0;
    for (let i = 0; i < line.text.length; i++) {
      const width = charWidths[i] ?? 0;
      if (x < currentX + (width / 2)) {
        return line.startIndex + i;
      }
      currentX += width;
    }

    return line.endIndex;
  }
}
