/**
 * Türkçe yerel biçim: binlik nokta, ondalık virgül.
 * State’te biçimli string tutulur; hesap için parse* fonksiyonları kullanılır.
 */

const MAX_MONEY_FRAC = 2;
const MAX_PERCENT_FRAC = 4;

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

/**
 * Tutar: binlik ayırıcı + virgülle ondalık.
 * `maxFracDigits` düşükse (2): tek noktada 1–2 hane ondalık; fazlası binlik sayılır (TL).
 * `maxFracDigits` yüksekse (8): uzun ondalık (kripto vb.) korunur.
 */
export function formatTrMoneyInput(raw: string, maxFracDigits: number = MAX_MONEY_FRAC): string {
  let s = raw.replace(/\s/g, '');
  if (s === '') return '';

  const commaIdx = s.lastIndexOf(',');
  let intDigits = '';
  let fracDigits = '';
  let trailingComma = false;

  if (commaIdx >= 0) {
    intDigits = s.slice(0, commaIdx).replace(/\./g, '').replace(/\D/g, '');
    fracDigits = s.slice(commaIdx + 1).replace(/\D/g, '').slice(0, maxFracDigits);
    trailingComma = commaIdx === s.length - 1 && fracDigits === '';
  } else {
    const dotCount = (s.match(/\./g) || []).length;
    if (dotCount === 0) {
      intDigits = s.replace(/\D/g, '');
    } else if (dotCount === 1) {
      const idx = s.indexOf('.');
      const before = s.slice(0, idx).replace(/\D/g, '');
      const after = s.slice(idx + 1).replace(/\D/g, '');
      if (after.length === 0) {
        intDigits = before;
      } else if (after.length <= maxFracDigits) {
        intDigits = before;
        fracDigits = after;
      } else if (maxFracDigits <= 2) {
        intDigits = s.replace(/\./g, '').replace(/\D/g, '');
      } else {
        intDigits = before || '0';
        fracDigits = after.slice(0, maxFracDigits);
      }
    } else {
      intDigits = s.replace(/\./g, '').replace(/\D/g, '');
    }
  }

  if (intDigits === '' && fracDigits === '') return '';
  const intNum = intDigits === '' ? 0 : parseInt(intDigits, 10);
  const intFormatted = intNum.toLocaleString('tr-TR');
  if (fracDigits.length > 0) return `${intFormatted},${fracDigits}`;
  if (trailingComma) return `${intFormatted},`;
  return intFormatted;
}

export function parseTrMoneyString(formatted: string): number {
  const c = formatted.lastIndexOf(',');
  if (c >= 0) {
    const left = formatted.slice(0, c).replace(/\./g, '').replace(/\D/g, '');
    const right = formatted.slice(c + 1).replace(/\D/g, '');
    if (left === '' && right === '') return Number.NaN;
    return parseFloat(`${left || '0'}.${right}`);
  }
  const digits = formatted.replace(/\./g, '').replace(/\D/g, '');
  if (digits === '') return Number.NaN;
  return parseInt(digits, 10);
}

/** API / sayısal değeri form alanına yazar. Yatırım (kripto) için `maxFracDigits` 8 kullanılabilir. */
export function formatTrMoneyFromNumber(n: number, maxFracDigits: number = 8): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '';
  const en = n.toLocaleString('en-US', {
    maximumFractionDigits: maxFracDigits,
    useGrouping: false
  });
  return formatTrMoneyInput(en, maxFracDigits);
}

/** Yüzde: virgül veya nokta ile ondalık; binlik yok. */
export function formatTrPercentageInput(raw: string): string {
  let s = raw.replace(/\s/g, '');
  if (s === '') return '';

  const commaIdx = s.lastIndexOf(',');
  const dotIdx = s.lastIndexOf('.');
  const useComma = commaIdx >= 0 && (dotIdx < 0 || commaIdx >= dotIdx);
  const sepIdx = useComma ? commaIdx : dotIdx >= 0 ? dotIdx : -1;

  let intPart = '';
  let fracPart = '';
  if (sepIdx >= 0) {
    intPart = s.slice(0, sepIdx).replace(/\D/g, '');
    fracPart = s.slice(sepIdx + 1).replace(/\D/g, '').slice(0, MAX_PERCENT_FRAC);
  } else {
    intPart = s.replace(/\D/g, '');
  }

  if (intPart === '' && fracPart === '') return '';
  const intNum = intPart === '' ? 0 : parseInt(intPart, 10);
  const intStr = intNum.toString();
  if (fracPart.length > 0) return `${intStr},${fracPart}`;
  if (sepIdx >= 0 && sepIdx === s.length - 1) return `${intStr},`;
  return intStr;
}

export function parseTrPercentageString(formatted: string): number {
  const normalized = formatted.trim().replace(/\s/g, '').replace(',', '.');
  return parseFloat(normalized);
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

/** Tam sayıya yuvarlanmış gibi görünüyorsa virgül gösterme (örn. asgari ödeme TL). */
export function formatTrFromEnOptionalKurus(en: string): string {
  const n = parseFloat(en);
  if (Number.isNaN(n)) return '';
  const cents = Math.round(n * 100) % 100;
  if (cents === 0) {
    return Math.round(n).toLocaleString('tr-TR', { maximumFractionDigits: 0 });
  }
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
