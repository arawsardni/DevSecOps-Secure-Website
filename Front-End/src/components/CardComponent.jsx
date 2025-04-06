"use client";
import { useRouter } from "next/navigation";

export default function CardComponent({ imgSrc, title, rating, price }) {
  const router = useRouter();

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find((item) => item.title === title);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: Date.now(), // generate ID sementara
        image: imgSrc.startsWith("/") ? imgSrc : `/${imgSrc}`,
        title,
        price,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${title} berhasil ditambahkan ke keranjang!`);
  };

  return (
    <div className="border rounded-lg overflow-hidden w-[250px] shadow-sm hover:shadow-md transition">
      <img src={imgSrc} alt={title} className="w-full h-64 object-cover" />
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-base">{title}</h3>
        <div className="flex items-center gap-2 text-yellow-500 text-sm">
          {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">
            {rating}
          </span>
        </div>
        <p className="text-lg font-semibold">Rp. {price}</p>
        <button
          onClick={handleAddToCart}
          className="bg-[#8B4513] hover:bg-[#6D3310] text-white px-4 py-1 rounded-md"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
