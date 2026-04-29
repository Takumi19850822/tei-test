type LineForTotal = {
  unit_price: number | string;
  quantity: number | string;
  tax_amount: number | string;
};

function toNumber(value: number | string): number {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeLineTaxAmount(
  unitPrice: number,
  quantity: number,
  taxRate: number,
): number {
  return roundTo2(unitPrice * quantity * (taxRate / 100));
}

export function computeParentTotals(lines: LineForTotal[]) {
  const subtotal = lines.reduce(
    (sum, line) => sum + toNumber(line.unit_price) * toNumber(line.quantity),
    0,
  );
  const taxAmount = lines.reduce((sum, line) => sum + toNumber(line.tax_amount), 0);
  const totalAmount = subtotal + taxAmount;

  return {
    subtotal: roundTo2(subtotal),
    taxAmount: roundTo2(taxAmount),
    totalAmount: roundTo2(totalAmount),
  };
}
