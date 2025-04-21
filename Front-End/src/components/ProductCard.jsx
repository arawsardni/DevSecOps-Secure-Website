import Link from "next/link";
import { formatRupiah } from "@/utils/formatters";
import { useEffect, useState } from "react";
import { getProductReviews } from "@/services/api";

export default function ProductCard({
  id,
  image_url,
  name,
  price,
  total_sold,
  rating,
  is_bestseller,
  is_featured,
}) {
  const [updatedRating, setUpdatedRating] = useState(rating || 0);

  // Fetch reviews from localStorage to calculate updated rating
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviews = await getProductReviews(id);

        if (reviews && reviews.length > 0) {
          // Calculate average rating
          const totalRating = reviews.reduce(
            (acc, review) => acc + Number(review.rating),
            0
          );
          const avgRating = totalRating / reviews.length;
          setUpdatedRating(avgRating);
        }
      } catch (error) {
        console.error("Error fetching reviews for product", id, error);
      }
    };

    fetchReviews();
  }, [id, rating]);

  // Determine badge type
  let badge = null;
  let badgeColor = "";

  if (is_bestseller) {
    badge = "Terlaris";
    badgeColor = "bg-yellow-500";
  } else if (is_featured) {
    badge = "Baru";
    badgeColor = "bg-green-500";
  }

  // Pastikan rating adalah angka dan dalam rentang 0-5
  const ratingNumber = Math.min(5, Math.max(0, Math.round(updatedRating) || 0));

  // Fungsi untuk memformat harga dengan benar
  const formatPrice = (price) => {
    if (typeof price === "string") {
      // Hapus semua karakter non-digit
      price = price.replace(/\D/g, "");
      price = parseInt(price);

      // Perbaiki format harga (harga mungkin 100 kali lipat terlalu besar)
      if (price >= 100000) {
        price = Math.round(price / 100);
      }
    } else {
      price = Number(price);
      if (price >= 100000) {
        price = Math.round(price / 100);
      }
    }

    // Pastikan harga valid
    if (isNaN(price)) {
      console.error("Invalid price:", price);
      price = 0;
    }

    return formatRupiah(price);
  };

  // Fungsi untuk mendapatkan URL gambar yang valid
  const getValidImageUrl = (imageUrl) => {
    if (!imageUrl) {
      console.log("No image URL provided, using default");
      return "/images/placeholder.jpg";
    }

    // Jika URL sudah lengkap, gunakan langsung
    if (imageUrl.startsWith("http")) {
      console.log("Using complete URL:", imageUrl);
      return imageUrl;
    }

    // Perbaiki path media
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://10.34.100.143:8000";
    console.log("API URL:", apiUrl);

    // Hapus '/api' jika ada di awal path
    let cleanUrl = imageUrl;
    if (cleanUrl.startsWith("/api/")) {
      cleanUrl = cleanUrl.substring(4);
      console.log("Removed /api/ prefix, new URL:", cleanUrl);
    }

    // Pastikan URL dimulai dengan garis miring
    if (!cleanUrl.startsWith("/")) {
      cleanUrl = "/" + cleanUrl;
      console.log("Added leading slash, new URL:", cleanUrl);
    }

    // Gabungkan dengan base URL API
    const finalUrl = `${apiUrl}${cleanUrl}`;
    console.log("Final image URL:", finalUrl);
    return finalUrl;
  };

  // Tambahkan error handling untuk gambar
  const handleImageError = (e) => {
    console.error("Error loading image:", e.target.src);
    // Coba URL alternatif jika gagal
    const currentUrl = e.target.src;
    if (currentUrl.includes("/api/")) {
      const alternativeUrl = currentUrl.replace("/api/", "/");
      console.log("Trying alternative URL:", alternativeUrl);
      e.target.src = alternativeUrl;
    } else {
      e.target.src = "/images/placeholder.jpg";
    }
  };

  return (
    <Link href={`/Product/${id}`} className="block">
      <div className="border rounded p-2 hover:shadow-md relative min-h-[320px] flex flex-col justify-between">
        {/* Badge */}
        {badge && (
          <span
            className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded ${badgeColor}`}
          >
            {badge}
          </span>
        )}

        {/* Gambar */}
        <img
          src={getValidImageUrl(image_url)}
          alt={name}
          className="w-full h-48 object-cover rounded-md"
          onError={handleImageError}
          onLoad={() => {
            console.log(
              "Image loaded successfully:",
              getValidImageUrl(image_url)
            );
          }}
        />

        {/* Info */}
        <div className="mt-2 flex flex-col justify-between flex-grow">
          {/* Judul fix tinggi biar rata */}
          <h3 className="font-semibold text-sm h-10 leading-tight line-clamp-2">
            {name}
          </h3>

          {/* Rating */}
          <div className="text-yellow-500 text-sm">
            {"★".repeat(ratingNumber)}
            {"☆".repeat(5 - ratingNumber)}
            <span className="text-gray-500 text-xs ml-1">({ratingNumber})</span>
          </div>

          <p className="text-sm">{formatPrice(price)}</p>
          <p className="text-xs text-gray-500">Terjual {total_sold}+</p>
        </div>
      </div>
    </Link>
  );
}
