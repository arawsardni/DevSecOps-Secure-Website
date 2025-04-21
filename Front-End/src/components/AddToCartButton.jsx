"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import * as cartService from "@/services/cartService";

export default function AddToCartButton({ product, customization, disabled }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
  }, []);

  const handleAdd = async () => {
    // Periksa apakah user sudah login
    const token = localStorage.getItem("access_token");
    if (!token) {
      // Arahkan ke halaman login jika belum login
      alert(
        "Anda perlu login terlebih dahulu untuk menambahkan produk ke keranjang"
      );
      router.push("/login");
      return;
    }

    try {
      setIsAdding(true);

      // Siapkan data produk untuk ditambahkan ke keranjang
      const productData = {
        product_id: product.id,
        quantity: customization.quantity || 1,
        size: customization.size || "M",
        sugar: customization.sugar || "normal",
        ice: customization.ice || "normal",
        shots: customization.shots || 0,
        special_instructions: customization.notes || "",
        // Tambahkan data tambahan untuk fallback ke localStorage
        price: product.price,
        product_detail: {
          name: product.name,
          image_url: product.image_url,
          price: product.price,
        },
      };

      console.log("Data yang dikirim ke API:", productData);

      // Gunakan cartService untuk menambahkan item ke keranjang
      await cartService.addCartItem(productData);
      alert("✅ Barang berhasil ditambahkan ke keranjang!");
    } catch (error) {
      console.error("Error adding item to cart:", error);
      alert("Gagal menambahkan barang ke keranjang. Silakan coba lagi.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={disabled || isAdding}
      className={`${
        disabled || isAdding
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-yellow-400 hover:bg-yellow-500"
      } text-white font-semibold py-2 px-4 rounded-lg w-full flex justify-center items-center`}
    >
      {isAdding ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Menambahkan...
        </span>
      ) : (
        "+ Keranjang"
      )}
    </button>
  );
}
