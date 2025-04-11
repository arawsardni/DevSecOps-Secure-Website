"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/utils/formatters";
import { pickupSuggestions } from "@/app/Product/data";
import * as cartService from "@/services/cartService";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [note, setNote] = useState("");
  const [pickupMethod, setPickupMethod] = useState("Pickup");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("QRIS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pickupLocation, setPickupLocation] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const router = useRouter();

  // Periksa apakah user login
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");

    if (!token) {
      // Redirect ke halaman login jika tidak ada token
      router.push("/login");
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);

    // Cek pesanan yang belum dibayar
    const userId = localStorage.getItem("user_id");
    const ordersKey = userId ? `orders_${userId}` : "orders";
    const savedOrders = localStorage.getItem(ordersKey);

    if (savedOrders) {
      try {
        const orders = JSON.parse(savedOrders);
        const pending = orders.filter((order) => order.status === "pending");
        setPendingOrders(pending);
      } catch (err) {
        console.error("Error checking pending orders:", err);
      }
    }

    const fetchCartItems = async () => {
      try {
        // Jika tidak login, kosongkan cart
        if (!isLoggedIn) {
          setCartItems([]);
          setLoading(false);
          return;
        }

        // Gunakan cartService untuk mengambil keranjang
        const { cart } = await cartService.getCart();
        console.log("Cart items loaded:", cart);

        if (!cart || cart.length === 0) {
          setCartItems([]);
          setLoading(false);
          return;
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        console.log("Using API URL:", apiUrl);

        // Ambil data produk dari backend untuk setiap item di cart yang belum memiliki detail
        const itemsWithDetails = await Promise.all(
          cart.map(async (item) => {
            // Jika item sudah memiliki detail produk lengkap, gunakan itu
            if (item.product_detail) {
              return {
                ...item,
                image: item.product_detail.image_url,
                title: item.product_detail.name,
                price: formatPrice(item.product_detail.price),
              };
            }

            try {
              // Gunakan product_id jika ada, jika tidak gunakan id
              const productId = item.product || item.product_id;
              const response = await fetch(
                `${apiUrl}/api/products/${productId}/`
              );

              if (!response.ok) {
                console.error(
                  `Failed to fetch product with ID ${productId}: ${response.status}`
                );
                console.log("Falling back to stored data for item:", item);
                return item;
              }

              const productData = await response.json();
              console.log("Product data found:", productData);

              // Format harga dengan benar
              const price = formatPrice(productData.price);
              console.log("Final price to be used:", price);

              return {
                ...item,
                image: productData.image_url,
                title: productData.name,
                price: price,
              };
            } catch (error) {
              console.error("Error fetching product details:", error);
              console.log("Falling back to stored data for item:", item);
              return item;
            }
          })
        );

        setCartItems(itemsWithDetails);
        setLoading(false);
      } catch (err) {
        console.error("Error loading cart:", err);
        setError("Gagal memuat keranjang belanja");
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchCartItems();
    }
  }, [isLoggedIn]);

  // Fungsi untuk memformat harga dengan benar
  const formatPrice = (price) => {
    if (typeof price === "string") {
      // Hapus semua karakter non-digit
      price = price.replace(/\D/g, "");
      price = parseInt(price);

      // Perbaiki format harga (harga mungkin 100 kali lipat terlalu besar)
      if (price >= 100000) {
        price = Math.round(price / 100);
      }
    } else {
      price = Number(price);
      if (price >= 100000) {
        price = Math.round(price / 100);
      }
    }

    // Pastikan harga valid
    if (isNaN(price)) {
      console.error("Invalid price:", price);
      price = 0;
    }

    return price;
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetch("http://localhost:8000/api/auth/profile/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Data profil:", data);
          // Periksa apakah ada array addresses
          if (
            data.addresses &&
            Array.isArray(data.addresses) &&
            data.addresses.length > 0
          ) {
            setSavedAddresses(data.addresses);

            // Gunakan alamat utama jika ada, jika tidak gunakan alamat pertama
            if (data.mainAddress !== null && data.mainAddress !== undefined) {
              const mainAddr = data.addresses[data.mainAddress];
              if (mainAddr && !address) {
                setAddress(mainAddr);
              }
            } else if (!address) {
              setAddress(data.addresses[0]);
            }
          } else if (data.address) {
            // Fallback ke format lama jika ada
            setSavedAddresses([data.address]);
            if (!address) {
              setAddress(data.address);
            }
          }
        })
        .catch((err) => {
          console.error("Gagal mengambil data profil user:", err);
        });
    }
  }, [address]);

  const handleQuantityChange = async (id, quantity) => {
    try {
      if (quantity <= 0) {
        // Hapus item dari keranjang
        const { cart } = await cartService.removeCartItem(id);
        setCartItems(cart);
      } else {
        // Update kuantitas
        const { cart } = await cartService.updateCartItem(id, { quantity });
        setCartItems(cart);
      }
    } catch (err) {
      console.error("Error updating cart item:", err);
      setError("Gagal mengubah kuantitas");
    }
  };

  const handleSizeChange = async (id, size) => {
    try {
      // Update ukuran dengan cartService
      const { cart } = await cartService.updateCartItem(id, { size });
      setCartItems(cart);
    } catch (err) {
      console.error("Error updating size:", err);
      setError("Gagal mengubah ukuran item");
    }
  };

  const getSizeExtraPrice = (size) => {
    if (size === "Medium") return 5000;
    if (size === "Large") return 10000;
    return 0;
  };

  const getValidImageUrl = (imagePath) => {
    if (!imagePath) {
      console.log("No image URL provided, using default");
      return "/sbcf-default-avatar.png";
    }

    // Jika URL sudah lengkap, gunakan langsung
    if (imagePath.startsWith("http")) {
      console.log("Using complete URL:", imagePath);
      return imagePath;
    }

    // Perbaiki path media
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    console.log("API URL:", apiUrl);

    // Hapus '/api' jika ada di awal path
    let cleanUrl = imagePath;
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
    console.log("Final image URL:", finalUrl);
    return finalUrl;
  };

  const total = cartItems.reduce((acc, item) => {
    try {
      // Pastikan harga adalah angka
      let basePrice = item.price;
      console.log(
        "Item price for total calculation:",
        basePrice,
        "Type:",
        typeof basePrice
      );

      if (typeof basePrice === "string") {
        // Hapus semua karakter non-digit
        basePrice = basePrice.replace(/\D/g, "");
        basePrice = parseInt(basePrice);

        // Perbaiki format harga (harga mungkin 100 kali lipat terlalu besar)
        if (basePrice >= 100000) {
          basePrice = Math.round(basePrice / 100);
          console.log("Total price scaled down:", basePrice);
        }
      } else {
        basePrice = Number(basePrice);
        if (basePrice >= 100000) {
          basePrice = Math.round(basePrice / 100);
        }
      }

      // Pastikan harga valid
      if (isNaN(basePrice)) {
        console.error("Invalid price for total calculation:", item.price);
        basePrice = 0;
      }

      const sizeExtra = getSizeExtraPrice(item.size);
      const itemTotal = (basePrice + sizeExtra) * item.quantity;
      console.log(
        "Item total:",
        itemTotal,
        "Base price:",
        basePrice,
        "Size extra:",
        sizeExtra,
        "Quantity:",
        item.quantity
      );

      return acc + itemTotal;
    } catch (err) {
      console.error("Error calculating total:", err);
      return acc;
    }
  }, 0);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-lg">Memuat keranjang belanja...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-lg text-red-500">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 bg-[#8B4513] text-white rounded"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {pendingOrders.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Anda memiliki {pendingOrders.length} pesanan yang belum dibayar
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Silakan selesaikan pembayaran atau batalkan pesanan Anda.</p>
                <div className="mt-2">
                  <button
                    onClick={() => router.push("/profile/Orders")}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Lihat Pesanan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Keranjang Belanja</h1>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          {cartItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Keranjang masih kosong.</p>
              <button
                onClick={() => router.push("/Product")}
                className="px-6 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
              >
                Mulai Belanja
              </button>
            </div>
          )}
          {cartItems.map((item) => {
            const imageUrl = getValidImageUrl(item.image);
            console.log("Product image URL:", imageUrl);

            return (
              <div
                key={item.id}
                className="flex justify-between items-center bg-white p-4 rounded shadow"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={imageUrl}
                    alt={item.title || "Product"}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      console.error("Image load error:", imageUrl);
                      // Coba URL alternatif jika gagal
                      const currentUrl = e.target.src;
                      if (currentUrl.includes("/api/")) {
                        const alternativeUrl = currentUrl.replace("/api/", "/");
                        console.log("Trying alternative URL:", alternativeUrl);
                        e.target.src = alternativeUrl;
                      } else {
                        e.target.src = "/sbcf-default-avatar.png";
                      }
                    }}
                  />
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm italic text-gray-500">
                      Ukuran: {item.size || "-"}
                      {getSizeExtraPrice(item.size) > 0 && (
                        <span className="ml-1 text-red-500">
                          (+{formatRupiah(getSizeExtraPrice(item.size))})
                        </span>
                      )}
                    </p>

                    <p>
                      {(() => {
                        let displayPrice = item.price;
                        console.log(
                          "Price for display:",
                          displayPrice,
                          "Type:",
                          typeof displayPrice
                        );

                        // Pastikan harga adalah number
                        if (typeof displayPrice === "string") {
                          // Hapus formatRupiah jika sudah ada
                          displayPrice = displayPrice.replace(/[^\d,]/g, "");
                          displayPrice = parseInt(displayPrice);

                          // Perbaiki format harga (harga mungkin 100 kali lipat terlalu besar)
                          if (displayPrice >= 100000) {
                            displayPrice = Math.round(displayPrice / 100);
                            console.log(
                              "Display price scaled down:",
                              displayPrice
                            );
                          }
                        } else if (typeof displayPrice === "number") {
                          if (displayPrice >= 100000) {
                            displayPrice = Math.round(displayPrice / 100);
                          }
                        }

                        // Pastikan harga valid
                        if (isNaN(displayPrice)) {
                          console.error(
                            "Invalid price for display:",
                            item.price
                          );
                          displayPrice = 0;
                        }

                        console.log("Final price for display:", displayPrice);
                        return formatRupiah(displayPrice);
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity - 1)
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[#D2B48C] text-white text-lg"
                  >
                    -
                  </button>
                  <span className="text-base">{item.quantity}</span>
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity + 1)
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[#D2B48C] text-white text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pickup Method */}
        <div>
          <p className="font-medium mb-2">Metode Pengambilan:</p>
          <div className="flex gap-4">
            <div
              onClick={() => setPickupMethod("Pickup")}
              className={`cursor-pointer border p-3 rounded-lg w-40 text-center ${
                pickupMethod === "Pickup" ? "border-green-500" : ""
              }`}
            >
              <img
                src="/pickup.png"
                alt="Pickup"
                className="w-8 mx-auto mb-1"
              />
              <p className="font-semibold">Pickup</p>
              <p className="text-xs text-gray-500">Ambil di store</p>
            </div>
            <div
              onClick={() => setPickupMethod("Delivery")}
              className={`cursor-pointer border p-3 rounded-lg w-40 text-center ${
                pickupMethod === "Delivery" ? "border-green-500" : ""
              }`}
            >
              <img
                src="/truck_2954822.png"
                alt="Delivery"
                className="w-8 mx-auto mb-1"
              />
              <p className="font-semibold">Delivery</p>
              <p className="text-xs text-gray-500">Diantar ke alamat</p>
            </div>
          </div>
        </div>

        {/* Pickup Location Dropdown */}
        {pickupMethod === "Pickup" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Lokasi Pengambilan
            </label>
            <select
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full border rounded p-2"
              required
            >
              <option value="">Pilih Lokasi</option>
              {pickupSuggestions.map((location, index) => (
                <option key={index} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Delivery Address */}
        {pickupMethod === "Delivery" && (
          <div>
            <label className="block font-medium mb-1">
              Alamat Pengantaran:
            </label>
            {savedAddresses.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedAddresses.map((addr, index) => {
                    const isSelected =
                      typeof address === "string"
                        ? address ===
                          (typeof addr === "string" ? addr : addr.address)
                        : address &&
                          address.address ===
                            (typeof addr === "string" ? addr : addr.address);

                    return (
                      <div
                        key={index}
                        onClick={() => setAddress(addr)}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-green-500 bg-green-50"
                            : "hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-start">
                          <div
                            className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center ${
                              isSelected
                                ? "border-green-500 bg-green-500"
                                : "border-gray-400"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <div>
                            {typeof addr === "string" ? (
                              <p className="font-medium">{addr}</p>
                            ) : (
                              <>
                                <p className="font-medium">{addr.label}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {addr.address}
                                </p>
                                {addr.note && (
                                  <p className="text-xs text-gray-500 mt-1 italic">
                                    {addr.note}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500">
                  Atau{" "}
                  <button
                    onClick={() => router.push("/profile")}
                    className="text-green-600 hover:underline"
                  >
                    tambah alamat baru
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Anda belum memiliki alamat tersimpan.{" "}
                  <button
                    onClick={() => router.push("/profile")}
                    className="text-green-600 hover:underline"
                  >
                    Tambah alamat di profil
                  </button>
                </p>
                <textarea
                  value={
                    typeof address === "string"
                      ? address
                      : address
                      ? address.address
                      : ""
                  }
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={300}
                  placeholder="Contoh: Jl. Lowokwaru No.12, Kota Malang, Jawa Timur"
                  className="border rounded w-full p-2 resize-none overflow-hidden"
                  rows={1}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block font-medium mb-1">
            Catatan untuk Penjual:
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Contoh: tanpa gula, extra ice, dll"
            className="border rounded w-full p-2 resize-none overflow-hidden"
            rows={1}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
          />
        </div>

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total: {formatRupiah(total)}</span>
          <button
            onClick={() => {
              if (pickupMethod === "Pickup" && !pickupLocation) {
                setError("Silakan pilih lokasi pengambilan");
                return;
              }
              if (pickupMethod === "Delivery" && !address) {
                setError("Silakan pilih alamat pengantaran");
                return;
              }

              // Simpan metode pengambilan dan alamat di localStorage
              const userId = localStorage.getItem("user_id");
              const deliveryInfoKey = userId
                ? `deliveryInfo_${userId}`
                : "deliveryInfo";
              const deliveryInfo = {
                pickupMethod: pickupMethod,
                pickupLocation: pickupLocation,
                address:
                  typeof address === "string"
                    ? address
                    : address?.address || "",
                note: note,
              };
              localStorage.setItem(
                deliveryInfoKey,
                JSON.stringify(deliveryInfo)
              );

              router.push("/Checkout");
            }}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
