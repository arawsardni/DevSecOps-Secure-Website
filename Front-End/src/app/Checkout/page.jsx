"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { products } from "../Product/data";
import { formatRupiah } from "@/utils/formatters";
import { getUserProfile } from "@/services/api";
import { pickupSuggestions } from "../Product/data";

const paymentMethods = [
  {
    id: "cash",
    name: "Tunai",
    description: "Bayar di tempat saat mengambil pesanan",
    icon: "💵",
  },
  {
    id: "transfer",
    name: "Transfer Bank",
    description: "Transfer ke rekening kami",
    icon: "🏦",
  },
  {
    id: "e_wallet",
    name: "E-Wallet",
    description: "Pembayaran melalui e-wallet",
    icon: "📱",
  },
];

export default function Checkout() {
  const router = useRouter();
    const [selectedItem, setSelectedItem] = useState(null);
    const [size, setSize] = useState("M");
    const [notes, setNotes] = useState("");
    const [pickupMethod, setPickupMethod] = useState("Pickup");
    const [paymentMethod, setPaymentMethod] = useState("QRIS");
    const [address, setAddress] = useState("");
  const [cart, setCart] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [pickupLocation, setPickupLocation] = useState("");

    useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("checkout")) || {
      id: 1,
      quantity: 1,
    };
        const product = products.find((p) => p.id === stored.id);
        setSelectedItem({ ...product, quantity: stored.quantity || 1 });
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
        fetch("http://localhost:8000/api/profile/", {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
          setAddress(data.address);
        });
    }
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const token = localStorage.getItem("access_token");

    // Coba ambil dari API jika user login
    if (token) {
      try {
        fetch("http://localhost:8000/api/cart/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch cart from API");
            return res.json();
          })
          .then((data) => {
            console.log("Cart data from API:", data);
            console.log(
              "Cart items structure:",
              data.items ? data.items[0] : "No items"
            );
            console.log(
              "Item price field:",
              data.items && data.items.length > 0
                ? {
                    base_price: data.items[0].base_price,
                    unit_price: data.items[0].unit_price,
                    total_price: data.items[0].total_price,
                    price: data.items[0].price,
                  }
                : "No item price"
            );

            if (data && data.items) {
              setCart(data.items);
            } else {
              setCart([]);
            }
          })
          .catch((err) => {
            console.error("Error fetching cart from API:", err);
            // Fallback ke localStorage jika API gagal
            fallbackToLocalStorage();
          });
      } catch (err) {
        console.error("Error in API cart fetching:", err);
        // Fallback ke localStorage
        fallbackToLocalStorage();
      }
    } else {
      // Gunakan localStorage untuk guest user
      fallbackToLocalStorage();
    }

    function fallbackToLocalStorage() {
      const cartKey = userId ? `cart_${userId}` : "cart";
      const savedCart = localStorage.getItem(cartKey);

      if (savedCart) {
        try {
          const cartData = JSON.parse(savedCart);
          console.log("Cart data from localStorage:", cartData);
          cartData.forEach((item, index) => {
            console.log(`Item ${index}:`, item);
            console.log(`Item ${index} properties:`, {
              id: item.id,
              title: item.title,
              name: item.name,
              product: item.product,
              price: item.price,
              quantity: item.quantity,
              product_detail: item.product_detail,
            });
          });
          setCart(cartData);
        } catch (err) {
          console.error("Error parsing cart data:", err);
          setCart([]);
        }
      } else {
        setCart([]);
      }
    }

    // Ambil informasi pengiriman dari localStorage
    const deliveryInfoKey = userId ? `deliveryInfo_${userId}` : "deliveryInfo";
    const savedDeliveryInfo = localStorage.getItem(deliveryInfoKey);

    if (savedDeliveryInfo) {
      try {
        const deliveryInfo = JSON.parse(savedDeliveryInfo);
        console.log("Delivery info loaded:", deliveryInfo);
        console.log(
          "Pickup method from localStorage:",
          deliveryInfo.pickupMethod
        );
        console.log(
          "Pickup location from localStorage:",
          deliveryInfo.pickupLocation
        );
        console.log("Address from localStorage:", deliveryInfo.address);

        setPickupMethod(deliveryInfo.pickupMethod || "Pickup");
        setPickupLocation(deliveryInfo.pickupLocation || "");
        setAddress(deliveryInfo.address || "");
        setNotes(deliveryInfo.note || "");
      } catch (err) {
        console.error("Error parsing delivery info:", err);
      }
    } else {
      console.log(
        "No delivery info found in localStorage with key:",
        deliveryInfoKey
      );
    }

    const loadUserProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.log("Token tidak ditemukan, melewati getUserProfile");
          return;
        }
        const profile = await getUserProfile(token);
        setUserProfile(profile);
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    };
    loadUserProfile();
    }, []);      

    if (!selectedItem) return <p>Loading...</p>;

    const handleQuantityChange = (value) => {
        setSelectedItem((prev) => ({
            ...prev,
            quantity: Math.max(1, prev.quantity + value),
        }));
    };

    const handleCheckout = () => {
        if (pickupMethod === "Delivery" && address.trim() === "") {
            alert("Mohon isi alamat pengantaran.");
            return;
        }
        alert("Checkout berhasil!");
    };

  const calculateSubtotal = () => {
    console.log("Calculating subtotal for cart:", cart);
    return cart.reduce((total, item) => {
      // Handle semua kemungkinan struktur data (API vs localStorage)
      let basePrice = 0;

      // Coba dapatkan harga dari berbagai format data yang mungkin
      if (item.unit_price !== undefined) {
        // Format API - unit price
        basePrice = Number(item.unit_price);
      } else if (item.total_price !== undefined && item.quantity) {
        // Format API - total price dibagi quantity
        basePrice = Number(item.total_price) / item.quantity;
      } else if (item.base_price !== undefined) {
        // Format API - base price
        basePrice = Number(item.base_price);
      } else if (item.price !== undefined) {
        // Format localStorage
        basePrice = Number(item.price);
      } else if (
        item.product_detail &&
        item.product_detail.price !== undefined
      ) {
        // Format lama localStorage
        basePrice = Number(item.product_detail.price);
      }

      const sizeExtraPrice = getSizeExtraPrice(item.size);
      const itemTotal = (basePrice + sizeExtraPrice) * item.quantity;

      const productName =
        item.product_name ||
        (item.product_detail
          ? item.product_detail.name
          : item.title || "Unknown");

      console.log(`Item ${productName}:`, {
        basePrice,
        unit_price: item.unit_price,
        total_price: item.total_price,
        base_price: item.base_price,
        price: item.price,
        sizeExtraPrice,
        quantity: item.quantity,
        itemTotal,
      });

      return total + itemTotal;
    }, 0);
  };

  const getSizeExtraPrice = (size) => {
    switch (size) {
      case "Large":
        return 5000;
      case "Medium":
        return 3000;
      default:
        return 0;
    }
  };

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      setError("Silakan pilih metode pembayaran");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");
      const orderNumber = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Proses item untuk memastikan data lengkap
      const processedItems = cart.map((item) => {
        // Pastikan nama produk tersedia
        const productName =
          item.product_name ||
          (item.product_detail ? item.product_detail.name : null) ||
          item.title ||
          "Produk";

        // Dapatkan harga dasar dengan benar
        const basePrice = Number(
          item.unit_price ||
            (item.total_price ? item.total_price / item.quantity : null) ||
            item.base_price ||
            item.price ||
            0
        );

        // Buat objek item yang lengkap
        return {
          ...item,
          title: productName, // Pastikan field title selalu ada
          product_name: productName, // Pastikan field product_name selalu ada
          price: basePrice, // Simpan harga dasar yang sudah diproses
          base_price: basePrice, // Pastikan base_price selalu ada
        };
      });

      const orderData = {
        orderNumber,
        items: processedItems, // Gunakan items yang sudah diproses
        totalAmount: calculateSubtotal(),
        paymentMethod: selectedPaymentMethod,
        status: "pending",
        createdAt: new Date().toISOString(),
        pickupMethod: pickupMethod,
        pickupLocation:
          pickupMethod === "Pickup" || pickupMethod === "pickup"
            ? pickupLocation
            : "",
        address:
          pickupMethod === "Delivery" || pickupMethod === "delivery"
            ? address
            : "",
        userId: userId,
      };

      const ordersKey = userId ? `orders_${userId}` : "orders";
      const orders = JSON.parse(localStorage.getItem(ordersKey) || "[]");

      orders.push(orderData);

      localStorage.setItem(ordersKey, JSON.stringify(orders));

      // Bersihkan keranjang di backend jika user login
      if (token) {
        try {
          const response = await fetch(
            "http://localhost:8000/api/cart/clear/",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            console.error("Failed to clear cart in backend");
          }
        } catch (err) {
          console.error("Error clearing cart in backend:", err);
        }
      }

      // Bersihkan keranjang di localStorage
      const cartKey = userId ? `cart_${userId}` : "cart";
      localStorage.removeItem(cartKey);

      router.push(`/Checkout/PaymentConfirmation?orderNumber=${orderNumber}`);
    } catch (err) {
      setError("Terjadi kesalahan saat memproses pembayaran");
      console.error("Payment error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

    return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center mb-4"
              >
                    <div>
                  <h3 className="font-medium">
                    {/* Handle struktur data dari API */}
                    {item.product_name ||
                      (item.product_detail
                        ? item.product_detail.name
                        : item.title || "Produk")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.quantity}x - {item.size}
                  </p>
                </div>
                <p className="font-medium">
                  {formatRupiah(
                    (Number(
                      item.unit_price ||
                        item.total_price / item.quantity ||
                        item.base_price ||
                        item.price ||
                        0
                    ) +
                      getSizeExtraPrice(item.size)) *
                      item.quantity
                  )}
                </p>
              </div>
            ))}
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>{formatRupiah(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatRupiah(calculateSubtotal())}</span>
              </div>
                </div>
            </div>

          {/* Metode Pengambilan */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Metode Pengambilan</h2>
            <div className="space-y-4">
              {pickupMethod === "Pickup" || pickupMethod === "pickup" ? (
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center border-green-500 bg-green-500">
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
                    </div>
                  <div>
                    <p className="font-medium">Pickup</p>
                    {pickupLocation && (
                      <p className="text-sm text-gray-600">
                        Lokasi: {pickupLocation}
                      </p>
                    )}
                    </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center border-green-500 bg-green-500">
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
            </div>
                <div>
                    <p className="font-medium">Delivery</p>
                    {address && (
                      <p className="text-sm text-gray-600">Alamat: {address}</p>
                    )}
                  </div>
                </div>
            )}
            </div>
          </div>
            </div>

        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Metode Pembayaran</h2>
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === method.id
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedPaymentMethod === method.id
                          ? "bg-green-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{method.name}</h3>
                        {selectedPaymentMethod === method.id && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {method.description}
                      </p>
                    </div>
                    </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={isProcessing || !selectedPaymentMethod}
              className={`w-full mt-6 py-3 rounded-lg font-medium ${
                isProcessing || !selectedPaymentMethod
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isProcessing ? "Memproses..." : "Bayar Sekarang"}
                </button>
          </div>
        </div>
            </div>
        </div>
    );
}
