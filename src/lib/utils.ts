import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to format time string (HH:MM) - can be expanded later
export function formatTime(timeString: string | undefined | null): string {
  if (!timeString) return "";
  // Basic formatting, assumes valid HH:MM input
  // Could add parsing and date-fns formatting for more robust handling
  return timeString;
}
