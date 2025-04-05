import Link from "next/link";

export default function ProductCard({ id, image, title, price, sold, rating, badge }) {
  const badgeColor = badge === "Terlaris"
    ? "bg-yellow-500"
    : badge === "Promo"
    ? "bg-red-500"
    : badge === "Baru"
    ? "bg-green-500"
    : "";

  return (
    <Link href={`/Product/${id}`} className="block">
      <div className="border rounded p-2 hover:shadow-md relative min-h-[320px] flex flex-col justify-between">
        {/* Badge */}
        {badge && (
          <span className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded ${badgeColor}`}>
            {badge}
          </span>
        )}

        {/* Gambar */}
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover rounded-md"
        />

        {/* Info */}
        <div className="mt-2 flex flex-col justify-between flex-grow">
          {/* Judul fix tinggi biar rata */}
          <h3 className="font-semibold text-sm h-10 leading-tight line-clamp-2">
            {title}
          </h3>

          {/* Rating */}
          <div className="text-yellow-500 text-sm">
            {"★".repeat(rating)}{"☆".repeat(5 - rating)}
          </div>

          <p className="text-sm">Rp {price}</p>
          <p className="text-xs text-gray-500">Terjual {sold}+</p>
        </div>
      </div>
    </Link>
  );
}
