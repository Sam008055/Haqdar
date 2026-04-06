/**
 * Cleans up raw OCR data which commonly mistakes visually similar characters.
 */
export function normalizeCertificateId(rawId: string): string {
  if (!rawId) return '';
  return rawId
    .replace(/\s+/g, '')              // Remove spaces
    .replace(/O/gi, '0')              // Assume usually numbers where 0 vs O is confused
    .replace(/[il\|]/gi, '1')         // Typical I/l/1 confusion
    .replace(/B/gi, '8')              // 8 vs B
    .toUpperCase();
}
