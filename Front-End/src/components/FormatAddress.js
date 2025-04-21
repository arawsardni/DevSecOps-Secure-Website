/**
 * Fungsi utilitas untuk memformat alamat agar konsisten di seluruh aplikasi.
 * Mengubah alamat dari berbagai format (string, objek, dll) menjadi string yang dapat ditampilkan.
 * 
 * @param {any} addressValue - Nilai alamat dalam berbagai format
 * @returns {string} - String alamat yang sudah diformat
 */
export const formatAddress = (addressValue) => {
  if (!addressValue) return "";
  
  // Jika alamat adalah string, gunakan langsung
  if (typeof addressValue === "string") {
    return addressValue;
  }
  
  // Jika alamat adalah objek dengan properti address, gunakan itu
  if (addressValue.address) {
    return addressValue.address;
  }
  
  // Jika alamat memiliki id tetapi tidak ada address, gunakan format default
  if (addressValue.id) {
    return `Alamat ID: ${addressValue.id}`;
  }
  
  // Jika semua gagal, konversi objek menjadi string
  try {
    return JSON.stringify(addressValue);
  } catch (e) {
    console.error("Error converting address to string:", e);
    return "Format alamat tidak valid";
  }
};

export default formatAddress; 