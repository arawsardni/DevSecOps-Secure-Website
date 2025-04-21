"use client";

import { useState, useEffect } from "react";
import { TextInput, Textarea } from "flowbite-react";
import MapPicker from "./MapPicker";
import { Trash2, Pencil, X } from "lucide-react";
import { getUserAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from "@/services/addressService";
import AddressMigrationButton from "./AddressMigrationButton";
import formatAddress from "./FormatAddress";

export default function AddressSection({
  addresses,
  setAddresses,
  mainAddress,
  setMainAddress,
}) {
  const [newAddress, setNewAddress] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState(null);
  const [dbAddresses, setDbAddresses] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cek apakah user login dan ambil alamat dari database
  useEffect(() => {
    // Skip on server-side rendering
    if (!isClient) return;
    
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);
      fetchAddressesFromDb(token);
    }
  }, [isClient]); // Re-run when isClient changes

  const fetchAddressesFromDb = async (token) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getUserAddresses(token);
      console.log("Fetched addresses from DB:", data);
      setDbAddresses(data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setErrorMsg("Gagal mengambil alamat dari database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapSelect = (coords, addressText) => {
    setNewAddress({
      label: "",
      address: addressText,
      note: "",
      coordinates: coords,
    });
  };

  const handleInput = (field, value) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditInput = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const saveNewAddress = async () => {
    if (!newAddress.label || !newAddress.address)
      return alert("Lengkapi nama & alamat.");
    
    // Jika user login, simpan ke database
    if (isLoggedIn) {
      const token = localStorage.getItem("access_token");
      
      try {
        setIsSaving(true);
        
        // Konversi koordinat dari objek ke string format "lat,lng"
        const coordinates = newAddress.coordinates ? 
          (typeof newAddress.coordinates === 'string' ? 
            newAddress.coordinates : 
            `${newAddress.coordinates.lat},${newAddress.coordinates.lng}`) : 
          "";
        
        const addressData = {
          label: newAddress.label,
          address: newAddress.address,
          note: newAddress.note || "",
          coordinates: coordinates,
          is_default: dbAddresses.length === 0 // Jika belum ada alamat, set sebagai default
        };
        
        console.log("Saving new address to DB:", addressData);
        const result = await createAddress(token, addressData);
        console.log("Address saved successfully:", result);
        
        // Refresh alamat dari database
        await fetchAddressesFromDb(token);
        setNewAddress(null);
      } catch (error) {
        console.error("Error saving address:", error);
        alert(`Gagal menyimpan alamat ke database: ${error.message}`);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Jika tidak login, simpan ke localStorage
      setAddresses([...addresses, newAddress]);
      setNewAddress(null);
    }
  };

  const saveEdit = async () => {
    // Jika user login, update di database
    if (isLoggedIn) {
      const token = localStorage.getItem("access_token");
      try {
        setIsSaving(true);
        
        const addressId = dbAddresses[editIndex].id;
        
        // Konversi koordinat dari objek ke string format "lat,lng"
        const coordinates = editData.coordinates ? 
          (typeof editData.coordinates === 'string' ? 
            editData.coordinates : 
            `${editData.coordinates.lat},${editData.coordinates.lng}`) : 
          "";
        
        const addressData = {
          label: editData.label,
          address: editData.address,
          note: editData.note || "",
          coordinates: coordinates,
          is_default: dbAddresses[editIndex].is_default
        };
        
        console.log(`Updating address ${addressId}:`, addressData);
        await updateAddress(token, addressId, addressData);
        
        // Refresh alamat dari database
        await fetchAddressesFromDb(token);
        setEditIndex(null);
        setEditData(null);
      } catch (error) {
        console.error("Error updating address:", error);
        alert("Gagal memperbarui alamat di database");
      } finally {
        setIsSaving(false);
      }
    } else {
      // Jika tidak login, update di localStorage
      const updated = addresses.map((addr, idx) =>
        idx === editIndex ? editData : addr
      );
      setAddresses(updated);
      setEditIndex(null);
      setEditData(null);
    }
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditData(null);
  };

  const confirmDelete = async (idx) => {
    const confirm = window.confirm(
      "Apakah kamu yakin ingin menghapus alamat ini?"
    );
    
    if (confirm) {
      // Jika user login, hapus di database
      if (isLoggedIn) {
        const token = localStorage.getItem("access_token");
        try {
          const addressId = dbAddresses[idx].id;
          await deleteAddress(token, addressId);
          await fetchAddressesFromDb(token); // Refresh alamat dari database
          
          if (editIndex === idx) {
            setEditIndex(null);
            setEditData(null);
          }
        } catch (error) {
          console.error("Error deleting address:", error);
          alert("Gagal menghapus alamat dari database");
        }
      } else {
        // Jika tidak login, hapus di localStorage
        const updated = addresses.filter((_, i) => i !== idx);
        setAddresses(updated);

        if (editIndex === idx) {
          setEditIndex(null);
          setEditData(null);
        } else if (editIndex > idx) {
          setEditIndex((prev) => prev - 1);
        }

        if (mainAddress === idx) {
          setMainAddress(null);
        } else if (mainAddress > idx) {
          setMainAddress((prev) => prev - 1);
        }
      }
    }
  };

  const handleSetDefault = async (idx) => {
    // Jika user login, set default di database
    if (isLoggedIn) {
      const token = localStorage.getItem("access_token");
      try {
        const addressId = dbAddresses[idx].id;
        await setDefaultAddress(token, addressId);
        await fetchAddressesFromDb(token); // Refresh alamat dari database
      } catch (error) {
        console.error("Error setting default address:", error);
        alert("Gagal menetapkan alamat utama");
      }
    } else {
      // Jika tidak login, set default di localStorage
      setMainAddress(idx);
    }
  };

  // Tentukan alamat yang akan ditampilkan (dari DB jika login, dari localStorage jika tidak)
  const displayAddresses = isLoggedIn ? dbAddresses : addresses;

  // Jika masih server-side rendering, render placeholder
  if (!isClient) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Alamat Pengiriman</h3>
        <div className="h-48 bg-gray-100 animate-pulse rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Alamat Pengiriman</h3>

      {/* Tombol Migrasi untuk user yang login dan punya alamat di localStorage */}
      {isLoggedIn && <AddressMigrationButton />}
      
      {errorMsg && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Memuat alamat...</p>
      ) : (
        <>
          <MapPicker onSelect={handleMapSelect} />
          <p className="text-sm text-gray-500 mb-2">(klik peta untuk menambah)</p>

          {newAddress && (
            <div className="bg-gray-50 border p-4 rounded-lg space-y-2 relative">
              <div>
                <label className="text-sm font-medium">Nama</label>
                <TextInput
                  value={newAddress.label}
                  onChange={(e) => handleInput("label", e.target.value)}
                  placeholder="Contoh: Rumah, Kantor"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Alamat dari Map</label>
                <TextInput value={newAddress.address} disabled />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Patokan Lokasi (Optional)
                </label>
                <Textarea
                  value={newAddress.note}
                  onChange={(e) => handleInput("note", e.target.value)}
                  placeholder="Patokan atau catatan"
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setNewAddress(null)}
                  className="text-red-500 text-sm"
                  disabled={isSaving}
                >
                  Hapus
                </button>
                <button
                  onClick={saveNewAddress}
                  className="bg-[#5A2E0D] text-white px-4 py-2 rounded-md"
                  disabled={isSaving}
                >
                  {isSaving ? "Menyimpan..." : "Simpan Alamat"}
                </button>
              </div>
            </div>
          )}

          {/* List Existing */}
          {displayAddresses.length > 0 && (
            <p className="font-semibold text-sm text-gray-600">
              🗂️ {isLoggedIn ? "Alamat Tersimpan" : "Pilih Alamat Utama"}
            </p>
          )}

          {displayAddresses.map((addr, idx) =>
            editIndex === idx ? (
              <div
                key={idx}
                className="p-4 border border-yellow-500 rounded-lg space-y-2 bg-yellow-50"
              >
                <div>
                  <label className="text-sm font-medium">Nama</label>
                  <TextInput
                    value={editData.label}
                    onChange={(e) => handleEditInput("label", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Alamat</label>
                  <TextInput
                    value={editData.address}
                    onChange={(e) => handleEditInput("address", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Patokan Lokasi</label>
                  <Textarea
                    value={editData.note}
                    onChange={(e) => handleEditInput("note", e.target.value)}
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-4">
                    <button
                      onClick={() => confirmDelete(idx)}
                      className="text-red-600 flex items-center text-sm"
                      disabled={isSaving}
                    >
                      <Trash2 size={16} className="mr-1" /> Hapus
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-600 text-sm flex items-center"
                      disabled={isSaving}
                    >
                      <X size={16} className="mr-1" /> Batal
                    </button>
                  </div>
                  <button
                    onClick={saveEdit}
                    className="bg-green-600 text-white px-4 py-2 rounded-md"
                    disabled={isSaving}
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={idx}
                className={`p-4 border rounded-lg relative ${
                  (isLoggedIn ? addr.is_default : mainAddress === idx) 
                    ? "border-[#8B4513]" 
                    : "border-gray-300"
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    checked={isLoggedIn ? addr.is_default : mainAddress === idx}
                    onChange={() => handleSetDefault(idx)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold">🏠 {addr.label}</p>
                    <p className="text-sm text-gray-600">{addr.address}</p>
                    {addr.note && (
                      <p className="text-sm italic text-gray-400">📍 {addr.note}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditIndex(idx) || setEditData(addr)}
                  className="absolute top-2 right-2 text-sm text-blue-600 flex items-center"
                >
                  <Pencil size={16} className="mr-1" /> Edit Alamat
                </button>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
