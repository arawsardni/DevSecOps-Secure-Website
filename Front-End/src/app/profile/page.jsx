"use client";

import { useEffect, useState } from "react";
import { TextInput, Textarea, Button } from "flowbite-react";
import AddressSection from "@/components/AddressSection";
import { pickupSuggestions } from "@/app/Product/data";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
});

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    avatar: "",
    preferred_pickup_location: "",
  });

  const [addresses, setAddresses] = useState([]);
  const [mainAddress, setMainAddress] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pickupQuery, setPickupQuery] = useState("");
  const [isClient, setIsClient] = useState(false); // ✅ Fix SSR issue

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user"));
    if (stored) {
      setUser(stored);
      setForm({
        name: stored.name,
        phone_number: stored.phone_number,
        avatar: stored.avatar,
        preferred_pickup_location: stored.preferred_pickup_location,
      });
      setAddresses(stored.addresses || []);
      setMainAddress(stored.mainAddress || null);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const isFormChanged =
      form.name !== user.name ||
      form.phone_number !== user.phone_number ||
      form.avatar !== user.avatar ||
      form.preferred_pickup_location !== user.preferred_pickup_location;

    const isAddressChanged = JSON.stringify(addresses) !== JSON.stringify(user.addresses || []);
    const isMainChanged = mainAddress !== user.mainAddress;

    setIsDirty(isFormChanged || isAddressChanged || isMainChanged);
  }, [form, addresses, mainAddress, user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const updated = { ...user, ...form, addresses, mainAddress };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
    setIsDirty(false);
    alert("Profile updated!");
  };

  if (!user) return <p className="p-6">Silakan login terlebih dahulu.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Summary */}
      <div className="text-center space-y-4">
        <img
          src={form.avatar || "/avatar-default.png"}
          alt="Avatar"
          className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-[#8B4513]"
        />
        <p className="text-xl font-semibold">{form.name}</p>
        <p className="text-sm text-gray-500">{user.email}</p>

        <div className="flex justify-center gap-4 mt-4">
          <div className="border-2 border-[#8B4513] bg-[#FFF7ED] rounded-xl p-4 w-40 text-center shadow">
            <div className="text-2xl">📦</div>
            <p className="font-semibold text-gray-800 mt-2 text-sm">Total Spent</p>
            <p className="text-[#8B4513] font-bold text-sm">
              Rp {parseInt(user.total_spent).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="border-2 border-[#8B4513] bg-[#FCEFC7] rounded-xl p-4 w-40 text-center shadow">
            <div className="text-2xl">💰</div>
            <p className="font-semibold text-gray-800 mt-2 text-sm">Points</p>
            <p className="text-[#8B4513] font-bold text-sm">{user.points}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-bold text-gray-700">Nama Lengkap</label>
          <TextInput name="name" value={form.name} onChange={handleChange} />
        </div>
        <div>
          <label className="block mb-1 text-sm font-bold text-gray-700">Nomor HP</label>
          <TextInput name="phone_number" value={form.phone_number} onChange={handleChange} />
        </div>
        <div>
          <label className="block mb-1 text-sm font-bold text-gray-700">Link Avatar</label>
          <TextInput name="avatar" value={form.avatar} onChange={handleChange} />
        </div>

        {/* Pickup Location with Suggestion */}
        <div className="relative z-10">
          <label className="block mb-1 text-sm font-bold text-gray-700">Pickup Location Favorit</label>
          <Textarea
            name="preferred_pickup_location"
            value={form.preferred_pickup_location}
            onChange={(e) => {
              const value = e.target.value;
              setForm({ ...form, preferred_pickup_location: value });
              setPickupQuery(value);
            }}
            rows={2}
          />
          {isClient && pickupQuery.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 z-50 bg-white border rounded-md mt-1 shadow overflow-y-auto"
              style={{ maxHeight: "160px" }}
            >
              {pickupSuggestions
                .filter((item) =>
                  item.toLowerCase().includes(pickupQuery.toLowerCase())
                )
                .map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setForm({ ...form, preferred_pickup_location: item });
                      setPickupQuery("");
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {item}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Address Section */}
        <AddressSection
          addresses={addresses}
          setAddresses={setAddresses}
          mainAddress={mainAddress}
          setMainAddress={setMainAddress}
        />

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!isDirty}
            className={`bg-[#5A2E0D] hover:bg-[#3B1E09] ${
              !isDirty ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>
  );
}
