export function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = "";
  
    for (const char of text) {
      const testLine = currentLine + char;
      const width = ctx.measureText(testLine).width;
  
      if (width > maxWidth && currentLine !== "") {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
  
    if (currentLine) lines.push(currentLine);
    return lines;
  }