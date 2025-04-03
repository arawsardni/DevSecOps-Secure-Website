import Link from 'next/link';

export default function ProductCard({ id, image, title, price, sold, rating, badge }) {
    const badgeColor = badge === "Terlaris" 
        ? "bg-yellow-500"
        : badge === "Promo" 
        ? "bg-red-500"
        : badge === "Baru"
        ? "bg-green-500"
        : "";

    return (
        <Link href={`/Product/${id}`}>
            <div className="relative rounded-xl border shadow-sm overflow-hidden transition-all hover:scale-[1.02] bg-white p-2 w-full max-w-[200px] cursor-pointer">
                {badge && <span className={`${badgeColor} text-white text-[10px] px-2 py-[2px] rounded absolute m-2 shadow-md`}>{badge}</span>}
                <img src={image} alt={title} className="rounded w-full h-36 object-cover" />
                <div className="mt-2 space-y-1">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">{title}</h3>
                    <div className="text-yellow-500 text-xs">
                        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                    </div>
                    <div className="font-bold text-sm">Rp {price}</div>
                    <div className="text-xs text-gray-500">Terjual {sold}+</div>
                </div>
            </div>
        </Link>
    );
}
