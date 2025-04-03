import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/lib/utils.js

export function formatRelativeDate(dateString) {
  const date = new Date(dateString); // ⬅️ parse dulu
  const now = new Date();
  const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (dayDiff < 1) return "Hari ini";
  if (dayDiff === 1) return "Kemarin";
  if (dayDiff < 30) return `${dayDiff} hari lalu`;
  if (dayDiff < 365) return `${Math.floor(dayDiff / 30)} bulan lalu`;
  return `${Math.floor(dayDiff / 365)} tahun lalu`;
}
