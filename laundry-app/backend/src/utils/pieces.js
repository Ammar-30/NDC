function extractPiecesFromItemName(itemName) {
  const text = String(itemName || '').trim();
  if (!text) return 1;

  const numericMatch = text.match(/(\d+)\s*(?:pc|pcs|piece|pieces)\b/i);
  if (numericMatch) {
    const parsed = Number.parseInt(numericMatch[1], 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }

  if (/\b(?:pc|pcs|piece|pieces)\b/i.test(text)) return 1;
  return 1;
}

module.exports = { extractPiecesFromItemName };
