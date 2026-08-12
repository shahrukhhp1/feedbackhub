const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

export function escapeCsvFormula(value: string): string {
  if (FORMULA_PREFIXES.some((p) => value.startsWith(p))) {
    return `'${value}`;
  }
  return value;
}

export function escapeCsvField(value: string): string {
  const escaped = escapeCsvFormula(value);
  if (escaped.includes(",") || escaped.includes('"') || escaped.includes("\n")) {
    return `"${escaped.replace(/"/g, '""')}"`;
  }
  return escaped;
}
