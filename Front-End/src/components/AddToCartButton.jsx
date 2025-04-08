"use client";
import { useRouter } from "next/navigation";

export default function AddToCartButton({ product, customization, disabled }) {
  const router = useRouter();

  const handleAdd = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        image: product.image,
        price: product.price,
        quantity: 1,
        size: customization.size,
        ice: customization.ice,
        sugar: customization.sugar,
        shot: customization.shot,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("✅ Barang berhasil ditambahkan ke keranjang!");
  };

  return (
    <button
      onClick={handleAdd}
      disabled={disabled}
      className={`${
        disabled
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-yellow-400 hover:bg-yellow-500"
      } text-white font-semibold py-2 px-4 rounded-lg w-full`}
    >
      + Keranjang
    </button>
  );
}