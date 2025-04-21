"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatRupiah } from "@/utils/formatters";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || searchParams.get("orderNumber");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate the total properly
  const calculateTotal = (orderData) => {
    // Fixed values - NEVER change this
    const DELIVERY_FEE = 10000;
    
    // Check if we have an order
    if (!orderData || !orderData.items || !orderData.items.length) {
      console.log("No valid order or items for total calculation");
      return 50000; // Reasonable default
    }
    
    try {
      // Calculate items total
      const itemsTotal = orderData.items.reduce((sum, item) => {
        // Get price with a decent fallback system
        let price = 0;
        if (typeof item.price === 'number') price = item.price;
        else if (typeof item.price === 'string') price = parseFloat(item.price);
        else if (item.unit_price) price = parseFloat(item.unit_price);
        else if (item.product_detail?.price) price = parseFloat(item.product_detail.price);
        else price = 25000; // Default price as fallback
        
        // Apply size extra
        const size = item.size || '';
        const sizeExtra = size === "Large" ? 5000 : size === "Medium" ? 3000 : 0;
        
        // Get quantity
        const quantity = parseInt(item.quantity || 1);
        
        // Calculate this item's total
        const itemTotal = (price + sizeExtra) * quantity;
        
        console.log(`Item total for ${item.product_name || item.title || 'Product'}:`, {
          price, sizeExtra, quantity, itemTotal
        });
        
        return sum + itemTotal;
      }, 0);
      
      // Calculate delivery fee
      const isDelivery = orderData.delivery_method === 'delivery' || 
                         orderData.pickupMethod === 'Delivery' ||
                         (typeof orderData.pickupMethod === 'string' && 
                         orderData.pickupMethod.toLowerCase() === 'delivery');
      
      // Always use exactly 10000 for delivery fee
      const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
      
      // Calculate discount
      const discount = parseFloat(orderData.discount_amount || 0);
      
      // Calculate final total
      const total = itemsTotal + deliveryFee - discount;
      
      console.log("Order total calculation:", {
        itemsTotal, deliveryFee, discount, total
      });
      
      // Extra safety check: if total is suspiciously large, use reasonable default
      if (total > 1000000 || total < 0) {
        console.error(`Total ${total} is suspiciously large or negative, using reasonable default`);
        return itemsTotal + 10000; // Items + standard delivery
      }
      
      return total;
    } catch (error) {
      console.error("Error calculating total:", error);
      return 50000; // Reasonable default on error
    }
  };

  useEffect(() => {
    if (!orderNumber) {
      router.push("/Cart");
      return;
    }

    const loadOrder = async () => {
      try {
        setLoading(true);
        let foundOrder = null;
        
        // Try loading from session storage first (this would be the API order data)
        const sessionOrder = sessionStorage.getItem("order");
        console.log("Looking for order in sessionStorage:", !!sessionOrder);
        
        if (sessionOrder) {
          try {
            const parsedOrder = JSON.parse(sessionOrder);
            console.log("Session storage order:", parsedOrder);
            
            // Check if this is the order we're looking for
            if ((parsedOrder.order_number && parsedOrder.order_number === orderNumber) ||
                (parsedOrder.orderNumber && parsedOrder.orderNumber === orderNumber) ||
                (parsedOrder.id && orderNumber.includes(parsedOrder.id))) {
              console.log("Found matching order in sessionStorage");
              foundOrder = parsedOrder;
            }
          } catch (e) {
            console.error("Error parsing session order:", e);
          }
        }
        
        // If not found in session storage, try localStorage
        if (!foundOrder) {
          console.log("Order not found in sessionStorage, checking localStorage");
          const userId = localStorage.getItem("user_id");
          const ordersKey = userId ? `orders_${userId}` : "orders";
          const ordersData = JSON.parse(localStorage.getItem(ordersKey) || "[]");
          
          foundOrder = ordersData.find(
            (order) => order.orderNumber === orderNumber ||
                      (order.order_number && order.order_number === orderNumber)
          );
          
          console.log("localStorage order search result:", foundOrder ? "Found" : "Not found");
        }

        if (!foundOrder) {
          setError(`Pesanan dengan nomor ${orderNumber} tidak ditemukan.`);
          setLoading(false);
          return;
        }

        console.log("Order data found:", foundOrder);
        console.log("Order items:", foundOrder.items);

        if (foundOrder.items && foundOrder.items.length > 0) {
          console.log("First item properties:", {
            title: foundOrder.items[0].title,
            product_name: foundOrder.items[0].product_name,
            name: foundOrder.items[0].name,
            product: foundOrder.items[0].product,
            product_detail: foundOrder.items[0].product_detail,
          });
        }

        setOrder(foundOrder);
        setLoading(false);
      } catch (err) {
        console.error("Error loading order:", err);
        setError("Gagal memuat data pesanan: " + err.message);
        setLoading(false);
      }
    };
    
    loadOrder();
  }, [orderNumber, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-lg">Memuat data pesanan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/Cart")}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Kembali ke Keranjang
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 bg-green-500 text-white text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mx-auto mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <h1 className="text-3xl font-bold">Pembayaran Berhasil!</h1>
        <p className="text-lg mt-1">
          Pesanan #{order.orderNumber || order.order_number} telah dikonfirmasi
        </p>
      </div>

      <div className="p-6">
        {order.items && order.items.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Detail Pesanan</h2>
            <div className="space-y-2">
              {order.items.map((item, index) => {
                // Get product name
                const productName = item.product_detail?.name || 
                                   item.product_name || 
                                   item.title || 
                                   `Product ${index + 1}`;
                
                // Improved price extraction logic
                let price = 0;
                
                if (item.price !== undefined && item.price !== null) {
                  price = Number(item.price);
                } else if (item.unit_price !== undefined && item.unit_price !== null) {
                  price = Number(item.unit_price);
                } else if (item.total_price !== undefined && item.total_price !== null && item.quantity) {
                  price = Number(item.total_price) / Number(item.quantity);
                } else if (item.product_detail?.price !== undefined) {
                  price = Number(item.product_detail.price);
                }
                
                console.log(`Item ${index} price details:`, {
                  price: item.price,
                  unit_price: item.unit_price,
                  total_price: item.total_price,
                  product_detail_price: item.product_detail?.price,
                  calculated_price: price
                });

                const quantity = Number(item.quantity || 1);
                const size = item.size || 'Regular';
                const sizeExtra = size === "Large" ? 5000 : size === "Medium" ? 3000 : 0;
                const totalItemPrice = (price + sizeExtra) * quantity;

                return (
                  <div key={index} className="flex justify-between">
                    <span>
                      {quantity}x {productName} ({size})
                    </span>
                    <span>{formatRupiah(totalItemPrice)}</span>
                  </div>
                );
              })}
              
              {/* After the items listing and before the total */}
              <div className="border-t pt-2 mt-2">
                {/* Show subtotal */}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {formatRupiah(order.items?.reduce((sum, item) => {
                      const price = parseFloat(item.price || item.unit_price || 0);
                      const quantity = parseInt(item.quantity || 1);
                      return sum + (price * quantity);
                    }, 0) || 0)}
                  </span>
                </div>
                
                {/* Show delivery fee if applicable */}
                {(order.delivery_method === 'delivery' || 
                  order.pickupMethod === 'Delivery' ||
                  (typeof order.pickupMethod === 'string' && 
                   order.pickupMethod.toLowerCase() === 'delivery')) && (
                  <div className="flex justify-between">
                    <span>Biaya Pengiriman</span>
                    <span>{formatRupiah(10000)}</span>
                  </div>
                )}
                
                {/* Show discount if any */}
                {(parseFloat(order.discount_amount || 0) > 0) && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon</span>
                    <span>-{formatRupiah(parseFloat(order.discount_amount))}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Metode Pengambilan</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium">{order.pickupMethod}</p>
            {order.pickupMethod === "Pickup" && order.pickupLocation && (
              <p className="text-gray-600">Lokasi: {order.pickupLocation}</p>
            )}
            {order.pickupMethod === "Delivery" && order.address && (
              <p className="text-gray-600">Alamat: {order.address}</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Status Pesanan</h2>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-700 font-medium">
              Pesanan Anda sedang diproses
            </p>
            <p className="text-green-600 mt-1">
              {order.pickupMethod === "Pickup"
                ? "Silakan ambil pesanan Anda di lokasi yang dipilih"
                : "Pesanan Anda akan segera dikirim ke alamat yang tertera"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/profile/Orders")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Lihat Riwayat Pesanan
          </button>
          <button
            onClick={() => router.push("/Product")}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Lanjut Belanja
          </button>
        </div>

        {/* Show the total amount */}
        <div className="border-t pt-2 mt-2 font-bold flex justify-between">
          <span>Total</span>
          <span>{formatRupiah(calculateTotal(order))}</span>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-6 text-center">Memuat...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
