/**
 * Proper name case for people's names, whatever was typed:
 * "muhammad amir inayat" -> "Muhammad Amir Inayat", "DARSHAN V" -> "Darshan V",
 * "ali-khan" -> "Ali-Khan", "o'brien" -> "O'Brien". Trims and collapses spaces.
 * Not for emails, bank account titles, product or brand names.
 */
export function formatPersonName(input: string | null | undefined): string {
  return String(input ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}
