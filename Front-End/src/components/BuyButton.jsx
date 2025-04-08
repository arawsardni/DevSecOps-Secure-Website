"use client";
import { useRouter } from "next/navigation";

export default function BuyButton({ product, customization, disabled }) {
  const router = useRouter();

  const handleBuy = () => {
    // bisa kirim customization lewat query juga kalau perlu
    router.push(`/Checkout?id=${product.id}`);
  };

  return (
    <button
      onClick={handleBuy}
      disabled={disabled}
      className={`${
        disabled
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700"
      } text-white font-semibold py-2 px-4 rounded-lg w-full`}
    >
      Beli Sekarang
    </button>
  );
}