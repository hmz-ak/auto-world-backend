export function toMoney(value: number | string | null | undefined): number {
  return Number(Number(value ?? 0).toFixed(2));
}

export function multiplyMoney(quantity: number | string, unitPrice: number | string): number {
  return toMoney(Number(quantity) * Number(unitPrice));
}
