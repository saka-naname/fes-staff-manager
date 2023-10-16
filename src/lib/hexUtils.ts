export const toHexString = (dec: number, minDigits: number) => {
  let hex = dec.toString(16);
  if (minDigits - hex.length > 0) hex = "0".repeat(minDigits - hex.length) + hex;
  return hex;
}
