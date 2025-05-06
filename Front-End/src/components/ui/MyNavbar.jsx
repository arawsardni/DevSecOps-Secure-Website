//myNavbar

"use client";

import { Button, Dropdown, Navbar, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logoutUser, getUserProfile } from "@/services/api";

export function MyNavbar() {
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Baca token dan data user dari localStorage
    const accessToken = localStorage.getItem("access_token");
    const userData = JSON.parse(localStorage.getItem("user_data"));

    if (accessToken && userData) {
      setToken(accessToken);
      setUser(userData);
    }

    const updateCartCount = () => {
      const userId = localStorage.getItem("user_id");
      const cartKey = userId ? `cart_${userId}` : "cart";
      const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
      const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(totalItems);
    };

    updateCartCount();

    // Event handler untuk memperbarui user data
    const handleUserUpdate = (event) => {
      try {
        // Cek apakah event memiliki detail dengan data user
        if (event && event.detail && event.detail.userData) {
          console.log(
            "Navbar - Menerima data user dari event:",
            event.detail.userData
          );
          let newUserData = { ...event.detail.userData };

          // Bersihkan URL avatar jika ada
          if (newUserData.avatar) {
            console.log("Original avatar URL from event:", newUserData.avatar);
            
            // Hapus /api/ dari avatar URL jika ada
            if (newUserData.avatar.includes('/api/')) {
              newUserData.avatar = newUserData.avatar.replace('/api/', '/');
              console.log("Cleaned /api/ from avatar URL:", newUserData.avatar);
            }
          }

          // Perbarui state dan localStorage
          setUser(null); // Reset state terlebih dahulu
          setTimeout(() => {
            setUser(newUserData); // Set state baru setelah delay kecil
            localStorage.setItem("user_data", JSON.stringify(newUserData));
          }, 10);
          return;
        }

        // Jika tidak ada detail, ambil dari localStorage
        const storedUserData = localStorage.getItem("user_data");
        if (storedUserData) {
          let userData = JSON.parse(storedUserData);
          console.log("Navbar - User data dari localStorage:", userData);
          
          // Bersihkan URL avatar jika ada
          if (userData.avatar) {
            console.log("Original avatar URL from localStorage:", userData.avatar);
            
            // Hapus /api/ dari avatar URL jika ada
            if (userData.avatar.includes('/api/')) {
              userData.avatar = userData.avatar.replace('/api/', '/');
              console.log("Cleaned /api/ from avatar URL in localStorage:", userData.avatar);
              // Simpan kembali ke localStorage dengan URL yang sudah dibersihkan
              localStorage.setItem("user_data", JSON.stringify(userData));
            }
          }
          
          setUser(null); // Reset state terlebih dahulu
          setTimeout(() => {
            setUser(userData); // Set state baru setelah delay kecil
          }, 10);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    };

    // Event handler untuk storage changes
    const handleStorageChange = () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user_data"));
        if (userData) {
          console.log(
            "Navbar - Storage change detected, updating user:",
            userData
          );
          setUser(null); // Reset state terlebih dahulu
          setTimeout(() => {
            setUser(userData); // Set state baru setelah delay kecil
          }, 10);
        }
        updateCartCount();
      } catch (error) {
        console.error("Error handling storage change:", error);
      }
    };

    // Event listeners
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-login", handleUserUpdate);

    // Initial update
    handleUserUpdate();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-login", handleUserUpdate);
    };
  }, []);

  // Tambahkan useEffect untuk memuat ulang profil pengguna secara berkala
  useEffect(() => {
    // Fungsi untuk memperbarui profil
    const refreshUserProfile = async () => {
      try {
        const userToken = localStorage.getItem("access_token");
        
        if (userToken && user) {
          console.log("Memperbarui profil pengguna dari server...");
          const profileData = await getUserProfile(userToken);
          
          if (profileData) {
            console.log("Profil berhasil diperbarui:", profileData);
            
            // Bersihkan URL avatar jika ada
            if (profileData.avatar && profileData.avatar.includes('/api/')) {
              profileData.avatar = profileData.avatar.replace('/api/', '/');
              console.log("Membersihkan URL avatar:", profileData.avatar);
            }
            
            // Simpan ke localStorage dan perbarui state
            localStorage.setItem("user_data", JSON.stringify(profileData));
            setUser(profileData);
          }
        }
      } catch (error) {
        console.log("Gagal memperbarui profil:", error);
      }
    };
    
    // Jalankan fungsi saat komponen dimuat
    refreshUserProfile();
    
    // Perbarui setiap 5 menit untuk memastikan data selalu fresh
    const refreshInterval = setInterval(refreshUserProfile, 5 * 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [user?.id]); // Hanya jalankan saat user ID berubah

  // Fungsi untuk memuat ulang avatar dengan timestamp
  const reloadAvatar = () => {
    if (!user || !user.avatar) {
      return "/sbcf-default-avatar.png";
    }
    
    // Hapus timestamp lama dari URL jika ada (untuk menghindari penumpukan parameter)
    let cleanAvatarUrl = user.avatar;
    if (cleanAvatarUrl.includes("?t=")) {
      cleanAvatarUrl = cleanAvatarUrl.substring(0, cleanAvatarUrl.indexOf("?t="));
    }
    
    // Bersihkan URL terlebih dahulu jika mengandung /api/
    if (cleanAvatarUrl.includes("/api/")) {
      cleanAvatarUrl = cleanAvatarUrl.replace("/api/", "/");
      console.log("Cleaned /api/ from avatar URL in reloadAvatar:", cleanAvatarUrl);
    }
    
    // Dapatkan URL yang valid melalui fungsi pembantu
    const validUrl = getValidAvatarUrl(cleanAvatarUrl);
    
    // Tambahkan timestamp baru untuk menghindari caching
    const timestamp = new Date().getTime();
    const newUrl = validUrl.includes("?") 
      ? `${validUrl}&t=${timestamp}` 
      : `${validUrl}?t=${timestamp}`;
    
    console.log("Final avatar URL with timestamp:", newUrl);
    return newUrl;
  };

  // Fungsi untuk mendapatkan URL avatar yang valid
  const getValidAvatarUrl = (avatarUrl) => {
    console.log("Original avatar URL:", avatarUrl);

    if (!avatarUrl) {
      console.log("No avatar URL, returning default");
      return "/sbcf-default-avatar.png";
    }

    // Jika URL sudah lengkap, dan tidak mengandung /api/ yang problematik, gunakan langsung
    if (avatarUrl.startsWith("http")) {
      // Hapus /api/ dari URL jika ada
      if (avatarUrl.includes("/api/")) {
        const fixedUrl = avatarUrl.replace("/api/", "/");
        console.log("Fixed complete URL by removing /api/:", fixedUrl);
        return fixedUrl;
      }
      console.log("Using complete URL:", avatarUrl);
      return avatarUrl;
    }

    // Perbaiki path media
    const baseApiUrl =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_BROWSER_API_URL || "http://10.34.100.143:8000"
        : process.env.NEXT_PUBLIC_API_URL || "http://backend:8000";
    console.log("API URL:", baseApiUrl);

    // Hapus '/api' jika ada di awal path
    let cleanUrl = avatarUrl;
    if (cleanUrl.startsWith("/api/")) {
      cleanUrl = cleanUrl.substring(4);
      console.log("Removed /api/ prefix, new URL:", cleanUrl);
    }

    // Pastikan path media dimulai dengan /media jika tidak ada
    if (!cleanUrl.startsWith("/media") && !cleanUrl.includes("/media/")) {
      if (cleanUrl.startsWith("/")) {
        cleanUrl = "/media" + cleanUrl;
      } else {
        cleanUrl = "/media/" + cleanUrl;
      }
      console.log("Added /media prefix, new URL:", cleanUrl);
    }

    // Pastikan URL dimulai dengan garis miring
    if (!cleanUrl.startsWith("/")) {
      cleanUrl = "/" + cleanUrl;
      console.log("Added leading slash, new URL:", cleanUrl);
    }

    // Gabungkan dengan base URL API tanpa /api di tengah
    const finalUrl = `${baseApiUrl}${cleanUrl}`;
    console.log("Final avatar URL:", finalUrl);
    return finalUrl;
  };

  // Tambahkan useEffect untuk memantau perubahan user
  useEffect(() => {
    if (user) {
      console.log("Navbar - User state updated:", user);
      // Reload avatar ketika user berubah
      reloadAvatar();
    }
  }, [user]);

  // Tambahkan error handling untuk gambar
  const handleImageError = (e) => {
    console.error("Error loading avatar:", e.target.src);
    // Coba URL alternatif jika gagal
    const currentUrl = e.target.src;
    
    // Simpan URL asli untuk mencegah loop infinite jika semua fallback gagal
    if (e.target.dataset.tryCount) {
      const tryCount = parseInt(e.target.dataset.tryCount);
      
      // Jika sudah mencoba lebih dari 2 kali, langsung gunakan avatar default
      if (tryCount > 2) {
        console.log("Too many retries, using default avatar");
        e.target.src = "/sbcf-default-avatar.png";
        return;
      }
      
      e.target.dataset.tryCount = tryCount + 1;
    } else {
      e.target.dataset.tryCount = 1;
      // Simpan URL asli untuk referensi
      e.target.dataset.originalSrc = currentUrl;
    }
    
    // Cara 1: Jika URL berisi "/api/", coba tanpa "/api/"
    if (currentUrl.includes("/api/")) {
      const alternativeUrl = currentUrl.replace("/api/", "/");
      console.log("Trying alternative URL:", alternativeUrl);
      e.target.src = alternativeUrl;
      return;
    } 
    
    // Cara 2: Jika URL berisi "/media/" tapi tidak bisa diakses, 
    // coba akses langsung ke port 8000 backend
    if (currentUrl.includes("/media/")) {
      // Pastikan kita menargetkan langsung ke backend
      const backendUrl = `http://10.34.100.143:8000${currentUrl.substring(currentUrl.indexOf("/media"))}`;
      console.log("Trying direct backend URL:", backendUrl);
      e.target.src = backendUrl;
      return;
    }
    
    // Cara 3: Coba tanpa timestamp (jika ada)
    if (currentUrl.includes("?t=")) {
      const urlWithoutTimestamp = currentUrl.substring(0, currentUrl.indexOf("?t="));
      console.log("Trying URL without timestamp:", urlWithoutTimestamp);
      e.target.src = urlWithoutTimestamp;
      return;
    }
    
    // Fallback ke avatar default sebagai pilihan terakhir
    console.log("All attempts failed, using default avatar");
    e.target.src = "/sbcf-default-avatar.png";
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      router.push(`/Product?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        console.log("Attempting to logout with token");
        const result = await logoutUser(token);
        if (result && result.success) {
          console.log("Logout successful from API");
        } else {
          console.log("Logout API returned non-success, continuing with local logout");
        }
      } else {
        console.log("No token found, performing local logout only");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Tetap lanjutkan dengan local logout meskipun API error
      console.log("Continuing with local logout despite API error");
    } finally {
      // Hapus cart berdasarkan user_id
      const userId = localStorage.getItem("user_id");
      if (userId) {
        localStorage.removeItem(`cart_${userId}`);
      }
      localStorage.removeItem("cart"); // Hapus cart lama juga

      // Clear local storage regardless of API result
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_data");
      localStorage.removeItem("user_id");
      setUser(null);
      setToken(null);
      
      // Tambahkan timeout kecil sebelum navigasi untuk memastikan state diperbarui
      setTimeout(() => {
        router.push("/");
      }, 100);
    }
  };

  const links = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Menu", href: "/Product" },
    { name: "Contact", href: "/Contact" },
  ];

  return (
    <Navbar
      fluid
      rounded
      className="bg-white text-[#5A2E0D] sticky top-0 z-50 shadow-sm"
    >
      {/* Brand */}
      <Navbar.Brand as={Link} href="/">
        <img src="/Logo.png" className="h-6 mr-3 sm:h-9" alt="Forcoffi Logo" />
        <span className="self-center whitespace-nowrap text-xl font-semibold text-[#8B4513]">
          Forcoffi
        </span>
      </Navbar.Brand>

      {/* Right Side */}
      <div className="flex items-center space-x-4 md:order-2">
        {/* Navbar Links */}
        <Navbar.Collapse>
          {links.map((link) => (
            <Navbar.Link
              key={link.name}
              as={Link}
              href={link.href}
              className={
                pathname === link.href ? "!text-[#8B4513] font-semibold" : ""
              }
            >
              {link.name}
            </Navbar.Link>
          ))}
        </Navbar.Collapse>
        {/* Cart */}
        <button onClick={() => router.push("/Cart")} className="relative">
          <img src="/Cart.png" className="w-7 h-7" alt="Cart" />
          {cartCount > 0 && (
            <span className="absolute px-2 text-xs text-white bg-red-500 rounded-full -top-2 -right-2">
              {cartCount}
            </span>
          )}
        </button>

        {/* Login / Avatar */}
        {user ? (
          <Dropdown
            label={
              <div className="relative">
                {console.log("Current avatar URL in render:", user.avatar)}
                {/* Coba akses langsung ke URL backend yang diketahui berfungsi */}
                <img
                  src={
                    user.avatar 
                      ? (user.avatar.includes('/media/') 
                          ? `http://10.34.100.143:8000${user.avatar.substring(user.avatar.indexOf('/media'))}` 
                          : user.avatar.includes('/api/') 
                            ? user.avatar.replace('/api/', '/') 
                            : user.avatar)
                      : '/sbcf-default-avatar.png'
                  }
                  alt="Avatar"
                  className="object-cover w-8 h-8 rounded-full"
                  onError={(e) => {
                    console.log("Error loading avatar:", e.target.src);
                    // Coba langsung menggunakan path ke backend jika URL lain gagal
                    try {
                      if (user.avatar && user.avatar.includes('/media/')) {
                        const mediaPath = user.avatar.substring(user.avatar.indexOf('/media'));
                        e.target.src = `http://10.34.100.143:8000${mediaPath}`;
                        console.log("Trying direct backend URL:", e.target.src);
                      } else {
                        // Fallback ke default
                        e.target.src = '/sbcf-default-avatar.png';
                      }
                    } catch (err) {
                      e.target.src = '/sbcf-default-avatar.png';
                    }
                  }}
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
              </div>
            }
            inline
          >
            <Dropdown.Header>
              <span className="block text-sm">{user.name || "Pengguna"}</span>
              <span className="block text-sm font-medium truncate">
                {user.email}
              </span>
            </Dropdown.Header>
            <Dropdown.Item onClick={() => router.push("/profile")}>
              Profile
            </Dropdown.Item>
            <Dropdown.Item onClick={() => router.push("/profile/Orders")}>
              Riwayat Pesanan
            </Dropdown.Item>
            <Dropdown.Item onClick={() => router.push("/profile/Reviews")}>
              Review Produk
            </Dropdown.Item>
            <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
          </Dropdown>
        ) : (
          <Link href="/login" passHref>
            <Button className="bg-[#5A2E0D] hover:bg-[#3B1E09] text-white">
              Login
            </Button>
          </Link>
        )}

        <Navbar.Toggle />
      </div>
    </Navbar>
  );
}
