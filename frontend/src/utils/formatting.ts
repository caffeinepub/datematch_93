import { fromUnixTime } from "date-fns";

export function fromNanoseconds(timestamp: bigint): Date {
  return fromUnixTime(Number(timestamp) / 1_000_000_000);
}

export function calculateAge(birthday: bigint): number {
  const now = BigInt(Date.now()) * BigInt(1000000);
  const diffNano = now - birthday;
  if (diffNano < 0n) return 0;
  const seconds = diffNano / 1000000000n;
  const years = seconds / (365n * 24n * 3600n);
  return Number(years);
}

export function kmToMiles(km: number): number {
  return km * 0.621371;
}

export function milesToKm(miles: number): number {
  return miles * 1.60934;
}
