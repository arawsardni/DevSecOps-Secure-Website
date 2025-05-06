"use client";

import { useEffect, useState } from "react";
import { TextInput, Textarea, Button } from "flowbite-react";
import AddressSection from "@/components/AddressSection";
import { pickupSuggestions } from "@/app/Product/data";
import dynamic from "next/dynamic";
import {
  getUserProfile,
  updateUserProfile,
  updateUserAddresses,
} from "@/services/api";
import { formatRupiah } from "@/utils/formatters";
import { useRouter } from "next/navigation";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
});

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    preferred_pickup_location: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [mainAddress, setMainAddress] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pickupQuery, setPickupQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Periksa token dari localStorage
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      // Redirect ke halaman login jika tidak ada token
      router.push("/login");
    }
  }, [router, isClient]);

  useEffect(() => {
    if (!token || !isClient) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile(token);
        setUser(data);
        setForm({
          name: data.name || "",
          phone_number: data.phone_number || "",
          preferred_pickup_location: data.preferred_pickup_location || "",
        });
        setAddresses(data.addresses || []);
        setMainAddress(data.mainAddress !== null ? data.mainAddress : null);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.message);
        // Jika error 401, redirect ke halaman login
        if (err.message.includes("401")) {
          localStorage.removeItem("access_token");
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, router, isClient]);

  useEffect(() => {
    if (!user) return;

    const isFormChanged =
      form.name !== user.name ||
      form.phone_number !== user.phone_number ||
      form.preferred_pickup_location !== user.preferred_pickup_location;

    const isAddressChanged =
      JSON.stringify(addresses) !== JSON.stringify(user.addresses || []);
    const isMainChanged = mainAddress !== user.mainAddress;
    const isAvatarChanged = avatarFile !== null;

    setIsDirty(
      isFormChanged || isAddressChanged || isMainChanged || isAvatarChanged
    );
  }, [form, addresses, mainAddress, user, avatarFile]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setForm({ ...form, avatar: "" }); // Reset avatar URL karena kita akan menggunakan file
      setIsDirty(true); // Set isDirty menjadi true saat avatar berubah
    }
  };

  const handleSave = async () => {
    if (!token || !isClient) return;

    try {
      setLoading(true);

      // Buat FormData untuk mengirim file
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("phone_number", form.phone_number);
      formData.append(
        "preferred_pickup_location",
        form.preferred_pickup_location
      );

      // Jika ada file avatar baru, tambahkan ke FormData
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // Tambahkan data alamat ke FormData
      formData.append("addresses", JSON.stringify(addresses));
      if (mainAddress !== null) {
        formData.append("mainAddress", mainAddress);
      }

      // Update profile info
      const updatedProfile = await updateUserProfile(token, formData);
      console.log("Profile updated:", updatedProfile);

      // Update state dan localStorage dengan data yang baru
      setUser(updatedProfile);
      localStorage.setItem("user_data", JSON.stringify(updatedProfile));

      // Hanya jalankan kode window saat di client side
      if (isClient) {
        // Trigger custom event untuk memberi tahu komponen lain bahwa user data berubah
        const userLoginEvent = new CustomEvent("user-login", {
          detail: { userData: updatedProfile },
        });
        window.dispatchEvent(userLoginEvent);

        // Trigger storage event untuk memastikan semua komponen diperbarui
        localStorage.setItem("user_data_timestamp", Date.now().toString());
      }

      setIsDirty(false);

      // Reset file preview
      if (avatarFile) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarFile(null);
        setAvatarPreview("");
      }

      // Perbarui tampilan profil dengan data terbaru
      const latestProfile = await getUserProfile(token);
      setUser(latestProfile);
      localStorage.setItem("user_data", JSON.stringify(latestProfile));

      // Kirim event lagi dengan data terbaru
      if (isClient) {
        const finalUserLoginEvent = new CustomEvent("user-login", {
          detail: { userData: latestProfile },
        });
        window.dispatchEvent(finalUserLoginEvent);
      }

      setForm({
        name: latestProfile.name || "",
        phone_number: latestProfile.phone_number || "",
        preferred_pickup_location:
          latestProfile.preferred_pickup_location || "",
      });

      alert("Profil berhasil diperbarui!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(`Gagal memperbarui profil: ${err.message || "Terjadi kesalahan"}`);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mendapatkan URL avatar yang valid
  const getValidAvatarUrl = (avatarUrl) => {
    console.log("Profile - Original avatar URL:", avatarUrl);

    if (!avatarUrl) {
      console.log("Profile - No avatar URL, returning default");
      return "/sbcf-default-avatar.png";
    }

    // Jika URL sudah lengkap, gunakan langsung
    if (avatarUrl.startsWith("http")) {
      console.log("Profile - Using complete URL:", avatarUrl);
      return avatarUrl;
    }

    // Perbaiki path media
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://10.34.100.143:8000";
    console.log("Profile - API URL:", apiUrl);

    // Hapus '/api' jika ada di awal path
    let cleanUrl = avatarUrl;
    if (cleanUrl.startsWith("/api/")) {
      cleanUrl = cleanUrl.substring(4);
      console.log("Profile - Removed /api/ prefix, new URL:", cleanUrl);
    }

    // Pastikan URL dimulai dengan garis miring
    if (!cleanUrl.startsWith("/")) {
      cleanUrl = "/" + cleanUrl;
      console.log("Profile - Added leading slash, new URL:", cleanUrl);
    }

    // Gabungkan dengan base URL API
    const finalUrl = `${apiUrl}${cleanUrl}`;
    console.log("Profile - Final avatar URL:", finalUrl);
    return finalUrl;
  };

  // Tambahkan error handling untuk gambar
  const handleImageError = (e) => {
    console.error("Profile - Error loading avatar:", e.target.src);
    // Coba URL alternatif jika gagal
    const currentUrl = e.target.src;
    if (currentUrl.includes("/api/")) {
      const alternativeUrl = currentUrl.replace("/api/", "/");
      console.log("Profile - Trying alternative URL:", alternativeUrl);
      e.target.src = alternativeUrl;
    } else {
      e.target.src = "/sbcf-default-avatar.png";
    }
  };

  if (loading && !user)
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-lg">Memuat data profil...</p>
      </div>
    );

  // Tampilkan loading screen saat di server side rendering
  if (!isClient) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-lg">Memuat data profil...</p>
      </div>
    );
  }

  if (error && !user)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              } else {
                router.refresh();
              }
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-lg">Silakan login terlebih dahulu.</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 bg-[#5A2E0D] hover:bg-[#3B1E09] text-white px-4 py-2 rounded-lg"
        >
          Login
        </button>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Summary */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <img
            src={avatarPreview || getValidAvatarUrl(user?.avatar)}
            alt="Avatar"
            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-[#8B4513]"
            onError={handleImageError}
            onLoad={() => {
              console.log(
                "Profile - Avatar berhasil dimuat:",
                avatarPreview || getValidAvatarUrl(user?.avatar)
              );
            }}
          />
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-[#8B4513] text-white p-2 rounded-full cursor-pointer hover:bg-[#5A2E0D] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </label>
          <input
            type="file"
            id="avatar-upload"
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>
        <p className="text-xl font-semibold">{form.name || "Pengguna"}</p>
        <p className="text-sm text-gray-500">{user?.email}</p>

        <div className="flex justify-center gap-4 mt-4">
          <div className="border-2 border-[#8B4513] bg-[#FFF7ED] rounded-xl p-4 w-40 text-center shadow">
            <div className="text-2xl">📦</div>
            <p className="font-semibold text-gray-800 mt-2 text-sm">
              Total Pengeluaran
            </p>
            <p className="text-[#8B4513] font-bold text-sm">
              {formatRupiah(user.total_spent)}
            </p>
          </div>
          <div className="border-2 border-[#8B4513] bg-[#FCEFC7] rounded-xl p-4 w-40 text-center shadow">
            <div className="text-2xl">💰</div>
            <p className="font-semibold text-gray-800 mt-2 text-sm">Poin</p>
            <p className="text-[#8B4513] font-bold text-sm">{user.points}</p>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={() => router.push("/profile/Orders")}
            className="bg-[#8B4513] text-white px-4 py-2 rounded-lg hover:bg-[#5A2E0D] transition-colors mr-2"
          >
            Lihat Riwayat Pesanan
          </button>
          <button
            onClick={() => router.push("/profile/Reviews")}
            className="bg-[#8B4513] text-white px-4 py-2 rounded-lg hover:bg-[#5A2E0D] transition-colors"
          >
            Review Produk
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-bold text-gray-700">
            Nama Lengkap
          </label>
          <TextInput name="name" value={form.name} onChange={handleChange} />
        </div>
        <div>
          <label className="block mb-1 text-sm font-bold text-gray-700">
            Nomor HP
          </label>
          <TextInput
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
          />
        </div>

        {/* Pickup Location with Suggestion */}
        <div className="relative z-10">
          <label className="block mb-1 text-sm font-bold text-gray-700">
            Lokasi Pengambilan Favorit
          </label>
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
            disabled={!isDirty || loading}
            className={`bg-[#5A2E0D] hover:bg-[#3B1E09] ${
              !isDirty || loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
