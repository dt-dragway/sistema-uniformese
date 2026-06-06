export const formatCurrency = (amount: number | string | undefined | null): string => {
  const num = Number(amount);
  if (isNaN(num)) return '0,00';
  // 'de-DE' explicitly uses dots for thousands and comma for decimals
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};
