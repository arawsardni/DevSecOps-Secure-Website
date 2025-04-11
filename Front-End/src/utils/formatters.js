/**
 * Format angka ke format Rupiah
 * @param {number} amount - Jumlah uang yang akan diformat
 * @param {boolean} withSymbol - Apakah menampilkan simbol Rp
 * @returns {string} Formatted price
 */
export function formatRupiah(amount, withSymbol = true) {
  // Tangani nilai yang mungkin undefined atau null
  if (amount === undefined || amount === null) {
    return withSymbol ? "Rp0" : "0";
  }

  // Pastikan amount adalah number
  if (typeof amount === "string") {
    // Hapus semua karakter non-digit
    amount = amount.replace(/\D/g, "");
    amount = parseInt(amount);
  }

  if (isNaN(amount)) {
    return withSymbol ? "Rp0" : "0";
  }

  // Format dengan pemisah ribuan titik
  const formattedAmount = amount
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return withSymbol ? `Rp${formattedAmount}` : formattedAmount;
}
