export function getParagraphs(text: string, maxLines = 10) {
  const paragraphs = text.split("\n");
  paragraphs.reverse();
  const lines: string[] = [];
  const nbLines = Math.min(maxLines, paragraphs.length);
  for (let i = 0; i < nbLines; i++) {
    const text = paragraphs.pop();
    if (text) {
      lines.push(text);
    }
  }
  paragraphs.reverse();
  lines[lines.length - 1] += paragraphs.join("");
  return lines;
}
