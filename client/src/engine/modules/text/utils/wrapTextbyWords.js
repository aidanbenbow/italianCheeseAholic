  /**
 * Wrap text by words, not characters.
 * Returns array of lines that fit in maxWidth.
 */
export function wrapTextByWords(ctx, text, maxWidth) {
  if (!text) return [];

  const lines = [];
  const parts = text.split("\n");
  let globalIndex = 0;

  parts.forEach((part, partIndex) => {
    if (part.length === 0) {
      lines.push({ text: "", startIndex: globalIndex, endIndex: globalIndex });
    } else {
      const partLines = wrapTextByWordsNoNewline(ctx, part, maxWidth, globalIndex);
      lines.push(...partLines);
    }

    globalIndex += part.length;
    if (partIndex < parts.length - 1) {
      globalIndex += 1; // account for the newline character
    }
  });

  return lines;
}

function wrapTextByWordsNoNewline(ctx, text, maxWidth, offset) {
  const tokens = text.match(/\s+|[^\s]+/g) || [];
  const lines = [];
  let currentLine = "";
  let lineStartIndex = offset;
  let currentIndex = offset;

  for (const token of tokens) {
    if (!currentLine) {
      lineStartIndex = currentIndex;
    }

    const testLine = currentLine + token;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
      currentIndex += token.length;
      continue;
    }

    if (currentLine) {
      lines.push({
        text: currentLine,
        startIndex: lineStartIndex,
        endIndex: lineStartIndex + currentLine.length
      });
      currentLine = "";
    }

    lineStartIndex = currentIndex;

    if (ctx.measureText(token).width <= maxWidth) {
      currentLine = token;
      currentIndex += token.length;
      continue;
    }

    // Hard break long tokens (including long whitespace runs)
    let partial = "";
    for (const char of token) {
      const testPartial = partial + char;
      if (ctx.measureText(testPartial).width <= maxWidth || partial === "") {
        partial = testPartial;
        currentIndex += 1;
      } else {
        lines.push({
          text: partial,
          startIndex: lineStartIndex,
          endIndex: lineStartIndex + partial.length
        });
        lineStartIndex += partial.length;
        partial = char;
        currentIndex += 1;
      }
    }

    currentLine = partial;
  }

  if (currentLine) {
    lines.push({
      text: currentLine,
      startIndex: lineStartIndex,
      endIndex: lineStartIndex + currentLine.length
    });
  }

  return lines;
}