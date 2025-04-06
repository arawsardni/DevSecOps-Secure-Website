"use client";

import { useState } from "react";
import { TextInput, Textarea } from "flowbite-react";
import MapPicker from "./MapPicker";
import { Trash2, Pencil, X } from "lucide-react";

export default function AddressSection({ addresses, setAddresses, mainAddress, setMainAddress }) {
  const [newAddress, setNewAddress] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState(null);

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

  const saveNewAddress = () => {
    if (!newAddress.label || !newAddress.address) return alert("Lengkapi nama & alamat.");
    setAddresses([...addresses, newAddress]);
    setNewAddress(null);
  };

  const saveEdit = () => {
    const updated = addresses.map((addr, idx) => (idx === editIndex ? editData : addr));
    setAddresses(updated);
    setEditIndex(null);
    setEditData(null);
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditData(null);
  };

  const confirmDelete = (idx) => {
    const confirm = window.confirm("Apakah kamu yakin ingin menghapus alamat ini?");
    if (confirm) {
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
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Alamat Pengiriman</h3>
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
            <label className="text-sm font-medium">Patokan Lokasi (Optional)</label>
            <Textarea
              value={newAddress.note}
              onChange={(e) => handleInput("note", e.target.value)}
              placeholder="Patokan atau catatan"
            />
          </div>
          <div className="flex justify-between items-center pt-2">
            <button onClick={() => setNewAddress(null)} className="text-red-500 text-sm">
              Hapus
            </button>
            <button onClick={saveNewAddress} className="bg-[#5A2E0D] text-white px-4 py-2 rounded-md">
              Simpan Alamat
            </button>
          </div>
        </div>
      )}

      {/* List Existing */}
      {addresses.length > 0 && (
        <p className="font-semibold text-sm text-gray-600">🗂️ Pilih Alamat Utama</p>
      )}

      {addresses.map((addr, idx) =>
        editIndex === idx ? (
          <div key={idx} className="p-4 border border-yellow-500 rounded-lg space-y-2 bg-yellow-50">
            <div>
              <label className="text-sm font-medium">Nama</label>
              <TextInput
                value={editData.label}
                onChange={(e) => handleEditInput("label", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Alamat</label>
              <TextInput value={editData.address} onChange={(e) => handleEditInput("address", e.target.value)} />
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
                <button onClick={() => confirmDelete(idx)} className="text-red-600 flex items-center text-sm">
                  <Trash2 size={16} className="mr-1" /> Hapus
                </button>
                <button onClick={cancelEdit} className="text-gray-600 text-sm flex items-center">
                  <X size={16} className="mr-1" /> Batal
                </button>
              </div>
              <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded-md">
                Simpan Perubahan
              </button>
            </div>
          </div>
        ) : (
          <div
            key={idx}
            className={`p-4 border rounded-lg relative ${
              mainAddress === idx ? "border-[#8B4513]" : "border-gray-300"
            }`}
          >
            <div className="flex items-start gap-2">
              <input
                type="radio"
                checked={mainAddress === idx}
                onChange={() => setMainAddress(idx)}
                className="mt-1"
              />
              <div>
                <p className="font-semibold">🏠 {addr.label}</p>
                <p className="text-sm text-gray-600">{addr.address}</p>
                {addr.note && <p className="text-sm italic text-gray-400">📍 {addr.note}</p>}
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
    </div>
  );
}
