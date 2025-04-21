"use client";

import { useState, useEffect } from 'react';
import { migrateAddressesFromLocalStorage } from '@/services/addressService';
import { useRouter } from 'next/navigation';

export default function AddressMigrationButton() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [hasAddresses, setHasAddresses] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
    
    // Check for addresses in various localStorage keys
    const checkLocalStorageAddresses = () => {
      try {
        // Check different possible keys for addresses
        const userId = localStorage.getItem('user_id');
        const possibleKeys = [
          userId ? `addresses_${userId}` : 'addresses',
          'addresses',
          userId ? `addressList_${userId}` : 'addressList',
          'addressList'
        ];
        
        // Try each key
        for (const key of possibleKeys) {
          const addressesStr = localStorage.getItem(key);
          if (addressesStr) {
            const addresses = JSON.parse(addressesStr);
            if (Array.isArray(addresses) && addresses.length > 0) {
              console.log(`Found addresses in localStorage under key: ${key}`);
              setHasAddresses(true);
              return;
            }
          }
        }
        
        // If no addresses found in any key
        setHasAddresses(false);
      } catch (e) {
        console.error('Error checking localStorage for addresses:', e);
        setHasAddresses(false);
      }
    };
    
    checkLocalStorageAddresses();
  }, []);

  const handleMigrateAddresses = async () => {
    setIsMigrating(true);
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Anda harus login terlebih dahulu');
        setIsMigrating(false);
        return;
      }

      const result = await migrateAddressesFromLocalStorage(token);
      
      if (result.status === 'success') {
        setMessage(result.message || 'Alamat berhasil dimigrasi ke database!');
        setHasAddresses(false); // Hide button after successful migration
        
        // Refresh halaman setelah 2 detik
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        setError(result.message || 'Terjadi kesalahan saat migrasi alamat');
      }
    } catch (err) {
      console.error('Error during address migration:', err);
      setError(err.message || 'Terjadi kesalahan saat migrasi alamat');
    } finally {
      setIsMigrating(false);
    }
  };

  // Jika tidak ada alamat di localStorage atau masih server-side rendering, jangan tampilkan komponen
  if (!isClient || !hasAddresses) {
    return null;
  }

  return (
    <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
      <h3 className="font-medium text-yellow-800">Alamat Tersimpan di Perangkat</h3>
      <p className="text-sm text-yellow-700 mt-1 mb-3">
        Kami menemukan alamat yang tersimpan di perangkat Anda. Migrasi alamat ini ke akun Anda untuk pengalaman yang lebih baik.
      </p>

      {message && (
        <div className="p-3 bg-green-100 text-green-700 rounded-md mb-3">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md mb-3">
          {error}
        </div>
      )}

      <button
        onClick={handleMigrateAddresses}
        disabled={isMigrating}
        className={`w-full py-2 px-4 font-medium rounded-md ${
          isMigrating 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-yellow-600 text-white hover:bg-yellow-700'
        }`}
      >
        {isMigrating ? 'Memproses...' : 'Migrasi Alamat ke Akun Saya'}
      </button>
    </div>
  );
} 