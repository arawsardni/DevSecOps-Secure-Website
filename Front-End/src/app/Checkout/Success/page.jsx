"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatRupiah } from "@/utils/formatters";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderNumber) {
      router.push("/Cart");
      return;
    }

    // Ambil data pesanan dari localStorage
    try {
      const userId = localStorage.getItem("user_id");
      const ordersKey = userId ? `orders_${userId}` : "orders";
      const ordersData = JSON.parse(localStorage.getItem(ordersKey) || "[]");

      const foundOrder = ordersData.find(
        (order) => order.orderNumber === orderNumber
      );

      if (!foundOrder) {
        setError("Pesanan tidak ditemukan");
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
    } catch (err) {
      console.error("Error loading order:", err);
      setError("Gagal memuat data pesanan");
    } finally {
      setLoading(false);
    }
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-500"
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
          </div>
          <h1 className="text-2xl font-bold mb-2">Pembayaran Berhasil!</h1>
          <p className="text-gray-600">
            Pesanan #{order.orderNumber} telah dikonfirmasi
          </p>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Detail Pesanan</h2>
            <div className="space-y-2">
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

                const totalItemPrice = (basePrice + sizeExtra) * item.quantity;

                return (
                  <div key={index} className="flex justify-between">
                    <span>
                      {item.quantity}x{" "}
                      {item.product_name || item.title || "Produk"} ({item.size}
                      )
                    </span>
                    <span>{formatRupiah(totalItemPrice)}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 mt-2 font-bold flex justify-between">
                <span>Total</span>
                <span>{formatRupiah(order.totalAmount)}</span>
              </div>
            </div>
          </div>

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
        </div>
      </div>
    </div>
  );
}
