export function formatStones(value) {
  if (!Number.isFinite(value)) return "0";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const denominator = 100;
  const numerator = Math.round(abs * denominator);
  const whole = Math.floor(numerator / denominator);
  const remainder = numerator % denominator;
  if (remainder === 0) return `${sign}${whole}`;
  const divisor = gcd(remainder, denominator);
  const fraction = `${remainder / divisor}/${denominator / divisor}`;
  return whole > 0 ? `${sign}${whole}又${fraction}` : `${sign}${fraction}`;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}
