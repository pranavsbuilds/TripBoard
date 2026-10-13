// Indian numbering format: 150000 -> 1,50,000
export function formatToINR(value: number | string): string {
  if (value === undefined || value === null || value === '') return '';
  const numStr = value.toString().replace(/[^0-9.]/g, '');
  if (!numStr) return '';

  const [integerPart, decimalPart] = numStr.split('.');

  // Format integer in Indian numbering system
  let lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart.slice(0, 2)}` : formattedInteger;
}

// Converts YYYY-MM-DD -> DD/MM/YYYY
export function toDDMMYYYY(isoDate: string): string {
  if (!isoDate) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDate)) return isoDate;
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return isoDate;
}

// Converts DD/MM/YYYY -> YYYY-MM-DD
export function toISODate(ddmmyyyy: string): string {
  if (!ddmmyyyy) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(ddmmyyyy)) return ddmmyyyy;
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return ddmmyyyy;
}
