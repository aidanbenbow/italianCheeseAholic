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
          charWidths: Array.isArray(line.charWidths) ? line.charWidths : [],
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
        width: 0,
        charWidths: []
      });
    }

    return {
      font: String(font ?? "14px sans-serif"),
      lines,
      lineHeight,
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
    const tokens = text.split(/(\s+)/).filter(Boolean);
    let currentLine = "";
    let currentCharWidths = [];
    let currentWidth = 0;

    const flushCurrent = () => {
      if (currentLine.length <= 0) return;
      const displayWidth = this._computeDisplayWidthWithoutTrailingWhitespace(
        currentLine,
        currentCharWidths,
        currentWidth
      );
      lines.push({
        text: currentLine,
        width: displayWidth,
        charWidths: currentCharWidths
      });
      currentLine = "";
      currentCharWidths = [];
      currentWidth = 0;
    };

    for (const token of tokens) {
      const measuredToken = this._measureToken(token, ctx);
      const nextWidth = currentWidth + measuredToken.width;

      if (nextWidth <= maxWidth) {
        currentLine += measuredToken.text;
        currentCharWidths.push(...measuredToken.charWidths);
        currentWidth = nextWidth;
        continue;
      }

      if (currentLine.length > 0) {
        flushCurrent();
      }

      if (measuredToken.width <= maxWidth || measuredToken.text.length <= 1) {
        currentLine = measuredToken.text;
        currentCharWidths = measuredToken.charWidths;
        currentWidth = measuredToken.width;
        continue;
      }

      const tokenLines = this._splitMeasuredTokenByChars(measuredToken, maxWidth);
      for (let i = 0; i < tokenLines.length; i++) {
        const tokenLine = tokenLines[i];
        const isLast = i === tokenLines.length - 1;

        if (isLast) {
          currentLine = tokenLine.text;
          currentCharWidths = tokenLine.charWidths;
          currentWidth = tokenLine.width;
        } else {
          lines.push(tokenLine);
        }
      }
    }

    flushCurrent();

    return lines;
  }

  static _measureToken(text, ctx) {
    const charWidths = [];
    let width = 0;

    for (const char of text) {
      const charWidth = ctx.measureText(char).width;
      charWidths.push(charWidth);
      width += charWidth;
    }

    return {
      text,
      width,
      charWidths
    };
  }

  static _splitMeasuredTokenByChars(measuredToken, maxWidth) {
    const lines = [];
    let currentText = "";
    let currentCharWidths = [];
    let currentWidth = 0;

    for (let i = 0; i < measuredToken.text.length; i++) {
      const char = measuredToken.text[i];
      const charWidth = measuredToken.charWidths[i] ?? 0;

      if ((currentWidth + charWidth) > maxWidth && currentText.length > 0) {
        lines.push({
          text: currentText,
          width: this._computeDisplayWidthWithoutTrailingWhitespace(
            currentText,
            currentCharWidths,
            currentWidth
          ),
          charWidths: currentCharWidths
        });
        currentText = "";
        currentCharWidths = [];
        currentWidth = 0;
      }

      currentText += char;
      currentCharWidths.push(charWidth);
      currentWidth += charWidth;
    }

    if (currentText.length > 0) {
      lines.push({
        text: currentText,
        width: this._computeDisplayWidthWithoutTrailingWhitespace(
          currentText,
          currentCharWidths,
          currentWidth
        ),
        charWidths: currentCharWidths
      });
    }

    return lines;
  }

  static _computeDisplayWidthWithoutTrailingWhitespace(text, charWidths, measuredWidth) {
    let displayWidth = measuredWidth;

    for (let index = text.length - 1; index >= 0; index--) {
      if (!/\s/.test(text[index])) {
        break;
      }

      displayWidth -= charWidths[index] ?? 0;
    }

    return Math.max(0, displayWidth);
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
