"use client";
import { useRouter } from "next/navigation";

export default function BuyButton({ product }) {
    const router = useRouter();

    const handleBuy = () => {
        router.push(`/Checkout?id=${product.id}`);
    };

    return (
        <button 
            onClick={handleBuy}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg w-full"
        >
            Beli Sekarang
        </button>
    );
}
