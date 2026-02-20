import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown): string {
  // We can't use isAxiosError here easily without importing axios, 
  // and we want to keep utils minimal. 
  // So we do a safe duck-typing check.
  const anyError = error as { response?: { data?: { message?: string | string[] } } };
  
  if (anyError?.response?.data?.message) {
    const message = anyError.response.data.message;
    return Array.isArray(message) ? message.join(', ') : String(message);
  }
  
  if (error instanceof Error) return error.message;
  
  return String(error);
}
