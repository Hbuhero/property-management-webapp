import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function humanizeDuration(isoDuration: string): string {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = isoDuration.match(regex);
  if (!match) return "Unknown";

  const hours = match[1] ? `${parseInt(match[1])} hour${match[1] !== "1" ? "s" : ""}` : "";
  const minutes = match[2] ? `${parseInt(match[2])} minute${match[2] !== "1" ? "s" : ""}` : "";
  const seconds = match[3] ? `${parseInt(match[3])} second${match[3] !== "1" ? "s" : ""}` : "";

  return [hours, minutes, seconds].filter(Boolean).join(", ");
}

/**
 * Simplifies a number into a compact string representation (e.g., 1.5K, 2.3M).
 * It returns the number with a maximum of 1 decimal place.
 */
export function simplifyNumber(num: number): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}
