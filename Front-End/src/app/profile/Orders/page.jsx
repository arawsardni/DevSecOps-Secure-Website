"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/utils/formatters";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Mengambil data pesanan dari API
        const { getUserOrders } = await import('@/services/orderService');
        const ordersData = await getUserOrders(token);
        console.log("Orders data loaded from API:", ordersData);
        
        if (ordersData && ordersData.length > 0) {
          // Standardize order data format
          const processedOrders = ordersData.map(order => {
            return {
              ...order,
              orderNumber: order.order_number,
              createdAt: order.created_at || new Date().toISOString(),
              items: order.items || [],
              totalAmount: order.total_amount || 0
            };
          });

          // Sort orders by date (newest first)
          const sortedOrders = processedOrders.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          
          setOrders(sortedOrders);
        } else {
          setOrders([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        
        // Fallback ke localStorage jika API gagal
        try {
          console.log("Falling back to localStorage for orders");
          const userId = localStorage.getItem("user_id");
          const ordersKey = userId ? `orders_${userId}` : "orders";
          const savedOrders = localStorage.getItem(ordersKey);
          
          if (savedOrders) {
            const ordersData = JSON.parse(savedOrders);
            console.log("Orders loaded from localStorage:", ordersData.length);
            
            // Standardize order data format
            const processedOrders = ordersData.map(order => {
              return {
                ...order,
                orderNumber: order.order_number || order.orderNumber,
                status: order.status || "pending",
                createdAt: order.created_at || order.createdAt || new Date().toISOString()
              };
            });

            // Sort orders by date (newest first)
            const sortedOrders = processedOrders.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            setOrders(sortedOrders);
          }
        } catch (err) {
          console.error("Error parsing localStorage orders:", err);
          setError("Gagal memuat riwayat pesanan: " + error.message);
        }
        
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [router, isClient]);

  const clearAllOrders = () => {
    if (!isClient) return;
    
    setIsClearing(true);
    try {
      // Hapus semua key yang dimulai dengan 'orders_'
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("orders_")) {
          localStorage.removeItem(key);
        }
      });
      // Hapus key 'orders' jika ada
      localStorage.removeItem("orders");
      setOrders([]);
      alert("Semua riwayat pesanan berhasil dihapus");
    } catch (err) {
      console.error("Error clearing orders:", err);
      alert("Gagal menghapus riwayat pesanan");
    } finally {
      setIsClearing(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const handleCancelOrder = (orderNumber) => {
    if (!isClient) return;
    
    if (window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
      const userId = localStorage.getItem("user_id");
      const ordersKey = userId ? `orders_${userId}` : "orders";
      const savedOrders = localStorage.getItem(ordersKey);

      if (savedOrders) {
        try {
          const ordersData = JSON.parse(savedOrders);
          const updatedOrders = ordersData.map((order) => {
            if (order.orderNumber === orderNumber) {
              return { ...order, status: "cancelled" };
            }
            return order;
          });

          localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
          setOrders(updatedOrders);
          alert("Pesanan berhasil dibatalkan");
        } catch (err) {
          console.error("Error cancelling order:", err);
          alert("Gagal membatalkan pesanan");
        }
      }
    }
  };

  const handlePayOrder = (order) => {
    if (!isClient) return;
    
    // Get the correct order number format
    const orderNumber = order.order_number || order.orderNumber;
    
    if (!orderNumber) {
      console.error("No valid order number found:", order);
      alert("Tidak dapat melanjutkan pembayaran: nomor pesanan tidak valid");
      return;
    }
    
    // Save order to sessionStorage for the payment page
    sessionStorage.setItem("order", JSON.stringify(order));
    
    // Navigate to payment confirmation page
    router.push(`/Checkout/PaymentConfirmation?order=${orderNumber}`);
  };

  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Memuat riwayat pesanan...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Memuat riwayat pesanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Riwayat Pesanan</h1>

      {orders.length > 0 ? (
        <>
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.orderNumber}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Pesanan #{order.orderNumber}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    {order.status === "pending"
                      ? "Menunggu Pembayaran"
                      : order.status === "processing"
                      ? "Diproses"
                      : order.status === "completed"
                      ? "Selesai"
                      : "Dibatalkan"}
                  </span>
                </div>

                <div className="space-y-4">
                  {order.items.map((item, index) => {
                    // Hitung harga dengan benar
                    const basePrice = Number(
                      item.unit_price ||
                        (item.total_price
                          ? item.total_price / item.quantity
                          : null) ||
                        item.base_price ||
                        item.price ||
                        0
                    );

                    const sizeExtra =
                      item.size === "Large"
                        ? 5000
                        : item.size === "Medium"
                        ? 3000
                        : 0;

                    const totalItemPrice =
                      (basePrice + sizeExtra) * item.quantity;

                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <div>
                          <p className="font-medium">
                            {item.product_name || item.title || "Produk"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.quantity}x - {item.size}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatRupiah(totalItemPrice)}
                        </p>
                      </div>
                    );
                  })}

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Total</span>
                      <span className="font-bold">
                        {formatRupiah(order.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Metode Pembayaran</span>
                      <span>
                        {order.paymentMethod === "cash"
                          ? "Tunai"
                          : order.paymentMethod === "transfer"
                          ? "Transfer Bank"
                          : "E-Wallet"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Metode Pengambilan</span>
                      <span>
                        {order.pickupMethod === "Pickup"
                          ? `Pickup (${order.pickupLocation})`
                          : `Delivery (${order.address})`}
                      </span>
                    </div>
                  </div>

                  {order.status === "pending" && (
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={() => handleCancelOrder(order.orderNumber)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Batalkan Pesanan
                      </button>
                      <button
                        onClick={() => handlePayOrder(order)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Bayar Sekarang
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Belum ada riwayat pesanan</p>
          <button
            onClick={() => router.push("/Product")}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mulai Belanja
          </button>
        </div>
      )}
    </div>
  );
}
