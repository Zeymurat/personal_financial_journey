/** Table badge label for investment `displayType` (stock, fund, crypto, …). */
export function investmentTableTypeLabel(
  t: (key: string) => string,
  displayType: string | undefined
): string {
  const d = displayType || '';
  if (d === 'stock') return t('table.typeStock');
  if (d === 'fund') return t('table.typeFund');
  if (d === 'crypto') return t('table.typeCrypto');
  if (d === 'gold') return t('table.typeGold');
  if (d === 'currency' || d === 'forex') return t('table.typeCurrency');
  if (d === 'preciousMetal') return t('table.typePreciousMetal');
  return t('table.typeOther');
}
