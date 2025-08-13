import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value || value === "undefined" || value === "null") {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch (error) {
    console.error("Error parsing JSON:", error, "Value:", value)
    return fallback
  }
}
