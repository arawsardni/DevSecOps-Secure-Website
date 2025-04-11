"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatRupiah } from "@/utils/formatters";
import { QRCodeCanvas } from "qrcode.react";

export default function PaymentConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCode, setQrCode] = useState("");

  // Generate random QR code data
  const generateRandomQRData = () => {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(7);
    return `ORDER-${order?.orderNumber}-${timestamp}-${random}`;
  };

  useEffect(() => {
    const orderNumber = searchParams.get("orderNumber");
    if (!orderNumber) {
      router.push("/Cart");
      return;
    }

    // Cek apakah ini pesanan yang sudah ada atau pesanan baru
    const userId = localStorage.getItem("user_id");
    const ordersKey = userId ? `orders_${userId}` : "orders";
    const savedOrders = localStorage.getItem(ordersKey);
    const pendingPayment = localStorage.getItem("pending_payment");

    if (pendingPayment) {
      try {
        const orderData = JSON.parse(pendingPayment);
        setOrder(orderData);
        setQrCode(generateRandomQRData());
        localStorage.removeItem("pending_payment"); // Hapus data setelah diambil
      } catch (err) {
        console.error("Error parsing pending payment:", err);
        setError("Gagal memuat data pesanan");
      }
    } else if (savedOrders) {
      try {
        const orders = JSON.parse(savedOrders);
        const orderData = orders.find((o) => o.orderNumber === orderNumber);
        if (orderData) {
          setOrder(orderData);
          setQrCode(generateRandomQRData());
        } else {
          setError("Pesanan tidak ditemukan");
        }
      } catch (err) {
        console.error("Error parsing orders:", err);
        setError("Gagal memuat data pesanan");
      }
    } else {
      setError("Pesanan tidak ditemukan");
    }
    setLoading(false);
  }, [searchParams, router]);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const userId = localStorage.getItem("user_id");
      const ordersKey = userId ? `orders_${userId}` : "orders";
      const savedOrders = localStorage.getItem(ordersKey);

      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        const updatedOrders = orders.map((o) => {
          if (o.orderNumber === order.orderNumber) {
            return { ...o, status: "completed" };
          }
          return o;
        });

        localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
        router.push(`/Checkout/Success?orderNumber=${order.orderNumber}`);
      }
    } catch (err) {
      console.error("Error confirming payment:", err);
      setError("Gagal mengkonfirmasi pembayaran");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = () => {
    if (window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
      const userId = localStorage.getItem("user_id");
      const ordersKey = userId ? `orders_${userId}` : "orders";
      const savedOrders = localStorage.getItem(ordersKey);

      if (savedOrders) {
        try {
          const orders = JSON.parse(savedOrders);
          const updatedOrders = orders.map((o) => {
            if (o.orderNumber === order.orderNumber) {
              return { ...o, status: "cancelled" };
            }
            return o;
          });

          localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
          router.push("/profile/Orders");
        } catch (err) {
          console.error("Error cancelling order:", err);
          setError("Gagal membatalkan pesanan");
        }
      }
    }
  };

  const getPaymentInstructions = () => {
    switch (order?.paymentMethod) {
      case "cash":
        return "Silakan siapkan uang tunai sesuai dengan total pembayaran.";
      case "transfer":
        return "Silakan transfer ke rekening kami:\nBank XYZ\nNo. Rek: 1234-5678-9012\nAtas Nama: Toko Kami";
      case "e_wallet":
        return "Silakan scan QR Code di bawah ini menggunakan aplikasi e-wallet Anda.";
      default:
        return "Silakan pilih metode pembayaran.";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>{error || "Pesanan tidak ditemukan"}</p>
          <button
            onClick={() => router.push("/Cart")}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Kembali ke Keranjang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Konfirmasi Pembayaran</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Detail Pesanan</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Nomor Pesanan</p>
              <p className="font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Pembayaran</p>
              <p className="font-medium text-lg">
                {formatRupiah(order.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Metode Pembayaran</p>
              <p className="font-medium">
                {order.paymentMethod === "cash"
                  ? "Tunai"
                  : order.paymentMethod === "transfer"
                  ? "Transfer Bank"
                  : "E-Wallet"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Metode Pengambilan</p>
              <p className="font-medium">
                {order.pickupMethod === "Pickup"
                  ? `Pickup (${order.pickupLocation})`
                  : `Delivery (${order.address})`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Instruksi Pembayaran</h2>
          <div className="prose max-w-none">
            <p className="whitespace-pre-line">{getPaymentInstructions()}</p>
          </div>
        </div>

        {order.paymentMethod === "e_wallet" && (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white border rounded-lg">
              <QRCodeCanvas value={qrCode} size={200} />
            </div>
            <p className="text-sm text-gray-500">
              QR Code ini bersifat unik dan hanya berlaku untuk transaksi ini
            </p>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={handleCancelOrder}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Batalkan Pesanan
          </button>
          <button
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className={`px-6 py-2 rounded text-white ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isProcessing ? "Memproses..." : "Saya Sudah Bayar"}
          </button>
        </div>
      </div>
    </div>
  );
}
