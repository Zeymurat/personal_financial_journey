/**
 * Türkçe yerel biçim: binlik ayırıcı nokta (örn. 200.000).
 * State’te biçimli string tutulur; hesap için parseTrIntegerString kullanılır.
 */

export function formatTrIntegerInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return '';
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return '';
  return n.toLocaleString('tr-TR');
}

export function parseTrIntegerString(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  if (digits === '') return Number.NaN;
  return parseInt(digits, 10);
}

/** Hesap sonucu (nokta ondalıklı İngilizce string) → ekranda 12.345,67 */
export function formatTrFixedTwoFromEnDecimal(en: string): string {
  const n = parseFloat(en);
  if (Number.isNaN(n)) return '';
  return n.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
