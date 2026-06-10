export function isInYamlFrontmatter(documentText: string, line: number): boolean {
  const lines = documentText.replace(/\r\n/g, "\n").split("\n");
  if (lines.length === 0 || stripBom(lines[0]).trim() !== "---") {
    return false;
  }

  for (let index = 1; index < lines.length; index += 1) {
    const text = lines[index].trim();
    if (text === "---" || text === "...") {
      return line >= 0 && line <= index;
    }
  }

  return line >= 0;
}

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, "");
}
