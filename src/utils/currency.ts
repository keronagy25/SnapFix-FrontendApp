export const formatEGP = (amount: number): string => {
  return `${amount.toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EGP`;
};

export const parseEGP = (formatted: string): number => {
  return parseFloat(formatted.replace(/[^0-9.]/g, ""));
};