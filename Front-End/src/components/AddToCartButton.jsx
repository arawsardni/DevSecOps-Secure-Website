// components/ui/AddToCartButton.jsx
"use client";
import { useRouter } from "next/navigation";

export default function AddToCartButton({ product }) {
  const router = useRouter();

  const handleAdd = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("✅ Barang berhasil ditambahkan ke keranjang!");
  };

  return (
    <button
      onClick={handleAdd}
      className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg w-full"
    >
      + Keranjang
    </button>
  );
}
