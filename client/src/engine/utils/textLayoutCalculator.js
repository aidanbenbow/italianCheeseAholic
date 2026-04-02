// textLayoutCalculator.js
// Calculates detailed line-by-line layout for text rendering and caret/selection positioning

export class TextLayoutCalculator {
  /**
   * Calculate detailed text layout (lines, line breaks, character positions)
   * @param {string} text - The text to layout
   * @param {CanvasRenderingContext2D} ctx - Canvas context for measuring
   * @param {number} maxWidth - Maximum width before wrapping
   * @param {string} font - Font string (e.g., "14px sans-serif")
   * @returns {Object} Layout data { lines, lineHeight, totalHeight }
   */
  static calculateLayout(text, ctx, maxWidth, font) {
    if (!ctx) {
      return {
        font: String(font ?? "14px sans-serif"),
        lines: [],
        lineHeight: 20,
        totalHeight: 0,
        maxLineWidth: 0
      };
    }

    ctx.save();
    ctx.font = String(font ?? "14px sans-serif");

    // Calculate line height from font metrics
    const metrics = ctx.measureText("M");
    const defaultAscent = metrics.actualBoundingBoxAscent ?? 14;
    const defaultDescent = metrics.actualBoundingBoxDescent ?? 4;
    const lineHeight = defaultAscent + defaultDescent;

    const lines = [];
    const normalizedText = String(text ?? "");
    const words = normalizedText.split(/\n/); // Split by newlines first

    let charIndex = 0;

    for (const word of words) {
      const wordLines = this._wrapText(word, ctx, maxWidth);

      for (const line of wordLines) {
        const sampleText = line.text.length > 0 ? line.text : "M";
        const lineMetrics = ctx.measureText(sampleText);
        const ascent = lineMetrics.actualBoundingBoxAscent ?? defaultAscent;
        const descent = lineMetrics.actualBoundingBoxDescent ?? defaultDescent;

        lines.push({
          text: line.text,
          startIndex: charIndex,
          endIndex: charIndex + line.text.length,
          width: line.width,
          ascent,
          descent
        });
        charIndex += line.text.length;
      }

      // Account for the newline character itself
      if (word !== words[words.length - 1]) {
        charIndex += 1; // newline
      }
    }

    ctx.restore();

    if (lines.length === 0) {
      lines.push({
        text: "",
        startIndex: 0,
        endIndex: 0,
        width: 0
      });
    }

    return {
      font: String(font ?? "14px sans-serif"),
      lines,
      lineHeight,
      totalHeight: lines.length * lineHeight,
      maxLineWidth: lines.reduce((max, line) => Math.max(max, line.width ?? 0), 0)
    };
  }

  /**
   * Wrap a single line of text to fit within maxWidth
   * @private
   */
  static _wrapText(text, ctx, maxWidth) {
    if (text.length === 0) {
      return [{ text: "", width: 0, charWidths: [] }];
    }

    if (maxWidth === Infinity) {
      const charWidths = [...text].map(c => ctx.measureText(c).width);
      return [{ text, width: ctx.measureText(text).width, charWidths }];
    }

    const lines = [];
    let currentLine = "";
    let currentCharWidths = [];

    for (const char of text) {
      const testLine = currentLine + char;
      const testWidth = ctx.measureText(testLine).width;
      const charWidth = ctx.measureText(char).width;

      if (testWidth > maxWidth && currentLine.length > 0) {
        lines.push({
          text: currentLine,
          width: ctx.measureText(currentLine).width,
          charWidths: currentCharWidths
        });
        currentLine = char;
        currentCharWidths = [charWidth];
      } else {
        currentLine = testLine;
        currentCharWidths.push(charWidth);
      }
    }

    if (currentLine.length > 0) {
      lines.push({
        text: currentLine,
        width: ctx.measureText(currentLine).width,
        charWidths: currentCharWidths
      });
    }

    return lines;
  }

  /**
   * Find which line a character index is on
   */
  static findLineForIndex(index, lines) {
    for (const line of lines) {
      if (index >= line.startIndex && index <= line.endIndex) {
        return line;
      }
    }
    return lines[lines.length - 1] ?? null;
  }

  /**
   * Get pixel position for a character index
   */
  static getCaretPosition(index, lines, lineHeight, ctx, nodeX, nodeY, paddingX, paddingY, font) {
    const line = this.findLineForIndex(index, lines);
    if (!line) {
      return { x: nodeX + paddingX, y: nodeY + paddingY };
    }

    ctx.save();
    ctx.font = font;

    const lineNumber = lines.indexOf(line);
    const offsetInLine = index - line.startIndex;
    const beforeText = line.text.slice(0, offsetInLine);

    const x = nodeX + paddingX + ctx.measureText(beforeText).width;
    const y = nodeY + paddingY + lineNumber * lineHeight;

    ctx.restore();

    return { x, y };
  }
}
