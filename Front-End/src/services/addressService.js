// Menggunakan URL yang berbeda berdasarkan environment
// - Di browser pengguna: http://localhost:8000/api
// - Di dalam container: http://backend:8000/api
const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_BROWSER_API_URL || "http://localhost:8000/api") 
  : (process.env.NEXT_PUBLIC_API_URL || "http://backend:8000/api");

/**
 * Mengambil semua alamat pengguna
 * @param {string} token - Token autentikasi
 * @returns {Promise} Promise yang mengembalikan array alamat
 */
export const getUserAddresses = async (token) => {
  try {
    const response = await fetch(`${API_URL}/addresses/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil alamat');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getUserAddresses:', error);
    throw error;
  }
};

/**
 * Mengambil alamat default pengguna
 * @param {string} token - Token autentikasi
 * @returns {Promise} Promise yang mengembalikan alamat default
 */
export const getDefaultAddress = async (token) => {
  try {
    const response = await fetch(`${API_URL}/addresses/default/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Tidak ada alamat default
      }
      throw new Error('Gagal mengambil alamat default');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getDefaultAddress:', error);
    throw error;
  }
};

/**
 * Membuat alamat baru
 * @param {string} token - Token autentikasi
 * @param {Object} addressData - Data alamat baru
 * @returns {Promise} Promise yang mengembalikan alamat yang dibuat
 */
export const createAddress = async (token, addressData) => {
  try {
    console.log('Creating new address with data:', addressData);
    
    const response = await fetch(`${API_URL}/addresses/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(addressData),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error('Invalid response format from server');
    }

    console.log('Create address response:', {
      status: response.status,
      ok: response.ok,
      data: responseData
    });

    if (!response.ok) {
      const errorMessage = responseData.error || 'Gagal membuat alamat';
      console.error('Server returned error:', errorMessage);
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error('Error in createAddress:', error);
    throw error;
  }
};

/**
 * Mengupdate alamat
 * @param {string} token - Token autentikasi
 * @param {string} addressId - ID alamat yang akan diupdate
 * @param {Object} addressData - Data alamat yang diperbarui
 * @returns {Promise} Promise yang mengembalikan alamat yang diperbarui
 */
export const updateAddress = async (token, addressId, addressData) => {
  try {
    const response = await fetch(`${API_URL}/addresses/${addressId}/update/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(addressData),
    });

    if (!response.ok) {
      throw new Error('Gagal mengupdate alamat');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in updateAddress:', error);
    throw error;
  }
};

/**
 * Menghapus alamat
 * @param {string} token - Token autentikasi
 * @param {string} addressId - ID alamat yang akan dihapus
 * @returns {Promise} Promise yang mengembalikan 204 No Content jika berhasil
 */
export const deleteAddress = async (token, addressId) => {
  try {
    const response = await fetch(`${API_URL}/addresses/${addressId}/delete/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Gagal menghapus alamat');
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAddress:', error);
    throw error;
  }
};

/**
 * Menetapkan alamat sebagai default
 * @param {string} token - Token autentikasi
 * @param {string} addressId - ID alamat yang akan dijadikan default
 * @returns {Promise} Promise yang mengembalikan alamat yang dijadikan default
 */
export const setDefaultAddress = async (token, addressId) => {
  try {
    const response = await fetch(`${API_URL}/addresses/${addressId}/set-default/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Gagal menetapkan alamat default');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in setDefaultAddress:', error);
    throw error;
  }
};

/**
 * Memigrasikan alamat dari localStorage ke database
 * @param {string} token - Token autentikasi
 * @returns {Promise} Promise yang mengembalikan hasil migrasi
 */
export const migrateAddressesFromLocalStorage = async (token) => {
  try {
    // Ambil data alamat dari localStorage dari berbagai kemungkinan key
    const userId = localStorage.getItem('user_id');
    const possibleKeys = [
      userId ? `addresses_${userId}` : 'addresses',
      'addresses',
      userId ? `addressList_${userId}` : 'addressList',
      'addressList'
    ];
    
    // Variabel untuk menyimpan alamat yang ditemukan
    let addresses = [];
    let sourceKey = '';
    let mainAddressIndex = -1;
    
    // Cek semua kemungkinan key
    for (const key of possibleKeys) {
      const addressesStr = localStorage.getItem(key);
      if (addressesStr) {
        try {
          const parsedAddresses = JSON.parse(addressesStr);
          if (Array.isArray(parsedAddresses) && parsedAddresses.length > 0) {
            addresses = parsedAddresses;
            sourceKey = key;
            
            // Cek key untuk main address yang sesuai
            const mainKey = key.replace('addresses', 'mainAddress').replace('addressList', 'mainAddress');
            const mainIndexStr = localStorage.getItem(mainKey);
            if (mainIndexStr) {
              mainAddressIndex = parseInt(mainIndexStr);
            }
            
            console.log(`Found ${addresses.length} addresses in localStorage key: ${key}`);
            console.log(`Main address index: ${mainAddressIndex}`);
            break;
          }
        } catch (e) {
          console.error(`Error parsing addresses from key ${key}:`, e);
        }
      }
    }
    
    if (addresses.length === 0) {
      return { 
        status: 'info',
        message: 'Tidak ada alamat yang tersimpan di localStorage' 
      };
    }
    
    console.log('Addresses to migrate:', addresses);
    
    // Format data untuk API
    const formattedAddresses = addresses.map((addr, index) => ({
      label: addr.label || `Alamat ${index + 1}`,
      address: addr.address || '',
      note: addr.note || '',
      coordinates: addr.coordinates || '',
      is_default: index === mainAddressIndex // Set alamat utama sebagai default
    }));
    
    // Kirim data ke API
    console.log('Sending formatted addresses to API:', formattedAddresses);
    
    const response = await fetch(`${API_URL}/addresses/migrate-from-localstorage/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ addresses: formattedAddresses }),
    });
    
    // Handle response
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error('Invalid response format from server');
    }
    
    console.log('Migration response:', responseData);
    
    if (!response.ok) {
      const errorMessage = responseData.message || responseData.error || 'Gagal migrasi alamat';
      throw new Error(errorMessage);
    }
    
    // Jika berhasil, hapus data di localStorage
    if (responseData.status === 'success' && sourceKey) {
      // Hapus alamat
      localStorage.removeItem(sourceKey);
      
      // Hapus main address
      const mainKey = sourceKey.replace('addresses', 'mainAddress').replace('addressList', 'mainAddress');
      localStorage.removeItem(mainKey);
      
      console.log(`Removed addresses from localStorage key: ${sourceKey}`);
    }
    
    return responseData;
  } catch (error) {
    console.error('Error in migrateAddressesFromLocalStorage:', error);
    throw error;
  }
}; 