//myNavbar

"use client";

import { Button, Dropdown, Navbar, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logoutUser } from "@/services/api";

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
          const newUserData = event.detail.userData;

          // Perbarui state dan localStorage
          setUser(null); // Reset state terlebih dahulu
          setTimeout(() => {
            setUser(newUserData); // Set state baru setelah delay kecil
            localStorage.setItem("user_data", JSON.stringify(newUserData));
          }, 10);
          return;
        }

        // Jika tidak ada detail, ambil dari localStorage
        const userData = JSON.parse(localStorage.getItem("user_data"));
        if (userData) {
          console.log("Navbar - User data dari localStorage:", userData);
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

  // Fungsi untuk memuat ulang avatar dengan timestamp
  const reloadAvatar = () => {
    if (user && user.avatar) {
      const timestamp = new Date().getTime();
      const avatarUrl = getValidAvatarUrl(user.avatar);
      const newUrl = avatarUrl.includes("?")
        ? `${avatarUrl}&t=${timestamp}`
        : `${avatarUrl}?t=${timestamp}`;

      console.log("Navbar - Loading avatar with URL:", newUrl);
      return newUrl;
    }
    return "/sbcf-default-avatar.png";
  };

  // Fungsi untuk mendapatkan URL avatar yang valid
  const getValidAvatarUrl = (avatarUrl) => {
    console.log("Original avatar URL:", avatarUrl);

    if (!avatarUrl) {
      console.log("No avatar URL, returning default");
      return "/sbcf-default-avatar.png";
    }

    // Jika URL sudah lengkap, gunakan langsung
    if (avatarUrl.startsWith("http")) {
      console.log("Using complete URL:", avatarUrl);
      return avatarUrl;
    }

    // Perbaiki path media
    const apiUrl = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_BROWSER_API_URL || "http://localhost:8000")
      : (process.env.NEXT_PUBLIC_API_URL || "http://backend:8000");
    console.log("API URL:", apiUrl);

    // Hapus '/api' jika ada di awal path
    let cleanUrl = avatarUrl;
    if (cleanUrl.startsWith("/api/")) {
      cleanUrl = cleanUrl.substring(4);
      console.log("Removed /api/ prefix, new URL:", cleanUrl);
    }

    // Pastikan URL dimulai dengan garis miring
    if (!cleanUrl.startsWith("/")) {
      cleanUrl = "/" + cleanUrl;
      console.log("Added leading slash, new URL:", cleanUrl);
    }

    // Gabungkan dengan base URL API
    const finalUrl = `${apiUrl}${cleanUrl}`;
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
    if (currentUrl.includes("/api/")) {
      const alternativeUrl = currentUrl.replace("/api/", "/");
      console.log("Trying alternative URL:", alternativeUrl);
      e.target.src = alternativeUrl;
    } else {
      e.target.src = "/sbcf-default-avatar.png";
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      router.push(`/Product?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await logoutUser(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
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
      router.push("/");
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
                <img
                  src={reloadAvatar()}
                  alt="Avatar"
                  className="object-cover w-8 h-8 rounded-full"
                  onError={handleImageError}
                  onLoad={() => {
                    console.log("Avatar berhasil dimuat:", reloadAvatar());
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
