"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserPurchaseHistory } from "@/services/orderService";
import { formatRupiah } from "@/utils/formatters";
import Link from "next/link";

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      router.push("/login");
      return;
    }

    const fetchPurchaseHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(
          "Fetching purchase history with token and userId:",
          !!token,
          userId
        );
        const history = await getUserPurchaseHistory(token, userId);
        console.log("Purchase history received:", history);
        console.log(`Total unique products: ${history.length}`);

        if (history.length === 0) {
          console.log(
            "No purchase history found - this could be because you have no completed orders or there's an issue with the API"
          );
        }

        setPurchaseHistory(history);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching purchase history:", error);
        setError("Gagal memuat riwayat pembelian: " + error.message);
        setLoading(false);
      }
    };

    fetchPurchaseHistory();
  }, [router, isClient]);

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Fungsi untuk mendapatkan URL gambar yang valid
  const getImageUrl = (path) => {
    if (!path) return null;

    // Jika URL sudah lengkap, gunakan langsung
    if (path.startsWith("http")) {
      return path;
    }

    // Gabungkan dengan base URL API
    const apiUrl =
      process.env.NEXT_PUBLIC_BROWSER_API_URL || "http://10.34.100.143:8000";
    return `${apiUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  if (!isClient || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Memuat riwayat pembelian...</p>
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
      <h1 className="text-2xl font-bold mb-6">Produk yang Pernah Dibeli</h1>

      {purchaseHistory.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {purchaseHistory.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <h2 className="text-lg font-semibold">{product.name}</h2>
                  <p className="text-gray-700">
                    <span className="text-green-600 font-medium">
                      Dibeli {product.purchase_count} kali
                    </span>
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-4">
                <span className="font-medium">Terakhir dibeli: </span>
                {formatDate(product.last_purchased)}
              </p>

              {/* Tambahkan tombol untuk review */}
              <Link
                href="/profile/Reviews"
                className="mb-4 inline-flex items-center text-sm text-amber-600 hover:text-amber-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                Tulis Review
              </Link>

              <h3 className="font-medium text-gray-800 mt-4 mb-2">
                Riwayat Pembelian:
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {product.orders.map((order, index) => (
                  <div key={index} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span className="text-sm">
                        Order #{order.order_number}
                      </span>
                      <span className="text-sm">
                        {formatDate(order.purchase_date)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {order.quantity}x {order.size || "Regular"}
                      </span>
                      <span className="font-medium">
                        {formatRupiah(order.price * order.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href={`/Product/Detail/${product.id}`}
                className="mt-4 block w-full text-center bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
              >
                Beli Lagi
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Anda belum memiliki riwayat pembelian
          </p>
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
