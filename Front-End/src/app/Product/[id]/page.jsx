"use client";
import { useParams } from "next/navigation";
import { getProductById, getProductReviews } from "@/services/api";
import ReviewProductCard from "@/components/ReviewProductCard";
import { useState, useEffect } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import BuyButton from "@/components/BuyButton";
import Link from "next/link";
import { formatRupiah } from "@/utils/formatters";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

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

  // Fungsi untuk memformat dan memvalidasi data produk
  const validateProductData = (data) => {
    if (!data) return null;

    // Pastikan data memiliki properti yang diperlukan
    const validatedProduct = {
      id: data.id || data.product_id || "",
      name: data.name || data.title || "Produk",
      image_url: data.image_url || data.image || "",
      price: data.price || 0,
      description: data.description || "Tidak ada deskripsi",
      total_sold: data.total_sold || 0,
      is_bestseller: data.is_bestseller || false,
      is_featured: data.is_featured || false,
      rating: data.rating || 0,
    };

    return validatedProduct;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) {
          setError("Produk tidak ditemukan");
          setLoading(false);
          return;
        }

        console.log("Attempting to fetch product with ID:", id);
        const data = await getProductById(id);
        console.log("Product data received:", data);

        // Validasi data produk
        const validatedProduct = validateProductData(data);
        if (!validatedProduct) {
          setError("Data produk tidak lengkap atau tidak valid");
          setLoading(false);
          return;
        }

        setProduct(validatedProduct);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;

      try {
        setReviewsLoading(true);
        console.log("Fetching reviews for product ID:", id);

        // Simpan ID produk saat ini untuk referensi
        localStorage.setItem("current_product_id", String(id));

        const reviewsData = await getProductReviews(id);
        console.log(
          `Retrieved ${reviewsData.length} reviews for product ${id}`,
          reviewsData
        );
        setReviews(reviewsData);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  // Fungsi untuk mendapatkan URL gambar yang valid
  const getValidImageUrl = (imageUrl) => {
    // Jika tidak ada URL, langsung kembalikan placeholder
    if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
      return "/images/placeholder.jpg";
    }

    // Jika URL sudah lengkap, gunakan langsung
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    try {
      // Perbaiki path media
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://10.34.100.143:8000";

      // Hapus '/api' jika ada di awal path
      let cleanUrl = imageUrl;
      if (cleanUrl.startsWith("/api/")) {
        cleanUrl = cleanUrl.substring(4);
      }

      // Pastikan URL dimulai dengan garis miring
      if (!cleanUrl.startsWith("/")) {
        cleanUrl = "/" + cleanUrl;
      }

      // Gabungkan dengan base URL API
      return `${apiUrl}${cleanUrl}`;
    } catch (error) {
      console.error("Error processing image URL:", error);
      return "/images/placeholder.jpg";
    }
  };

  // Handle image error
  const handleImageError = (e) => {
    // Avoid infinite loop
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/images/placeholder.jpg";
  };

  if (loading)
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row gap-8 shadow rounded-lg p-4 bg-white">
          {/* Image Skeleton */}
          <div className="flex-1">
            <div className="rounded-xl w-full h-[450px] bg-gray-200 animate-pulse"></div>
          </div>
          {/* Info Skeleton */}
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-yellow-600 mb-2">
            Produk Tidak Ditemukan
          </h2>
          <p className="text-yellow-500 mb-4">
            Produk yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <Link
            href="/Product"
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
          >
            Kembali ke Daftar Produk
          </Link>
        </div>
      </div>
    );

  // Hitung rating rata-rata dari review localStorage
  const calculateAvgRating = () => {
    if (reviews.length === 0) {
      return Number(product.rating || 0); // Pastikan mengembalikan tipe Number
    }
    const total = reviews.reduce(
      (acc, review) => acc + Number(review.rating),
      0
    );
    return total / reviews.length;
  };

  const avgRating = calculateAvgRating();

  // Format rating untuk display (1 angka desimal)
  const displayRating = avgRating ? avgRating.toFixed(1) : "0.0";

  // Hitung jumlah review berdasarkan bintang
  const ratingCounts = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  reviews.forEach((review) => {
    const rating = Math.floor(Number(review.rating));
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating]++;
    }
  });

  // Persentase untuk tampilan bar rating
  const calculateRatingPercentage = (rating) => {
    if (reviews.length === 0) return 0;
    return (ratingCounts[rating] / reviews.length) * 100;
  };

  const reviewsPerPage = 5; // Limit the reviews per page
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  // Sorting function
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "newest") {
      return (
        new Date(b.createdAt || b.updatedAt || Date.now()) -
        new Date(a.createdAt || a.updatedAt || Date.now())
      );
    }
    return (
      new Date(a.createdAt || a.updatedAt || Date.now()) -
      new Date(b.createdAt || b.updatedAt || Date.now())
    );
  });

  // Paginate reviews
  const reviewsToDisplay = sortedReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  // Function to handle "Show More" pagination
  const handleShowMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    } else {
      setCurrentPage(1); // Reset back to the first page or show all if needed
    }
  };

  // Handle sorting by newest/oldest
  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
    setCurrentPage(1); // Reset to the first page after sorting
  };

  // Fungsi untuk mengubah kuantitas
  const handleQuantityChange = (change) => {
    setQuantity((prevQuantity) => Math.max(1, prevQuantity + change));
  };

  // Validasi form berdasarkan tipe produk
  const isValid = () => {
    return size && quantity >= 1;
  };

  // Handler untuk perubahan form
  const handleFormChange = (field, value) => {
    switch (field) {
      case "size":
        setSize(value);
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 shadow rounded-lg p-4 bg-white">
        {/* Image */}
        <div className="flex-1">
          <img
            src={getValidImageUrl(product.image_url || product.image)}
            alt={product.name}
            className="rounded-xl w-full max-h-[450px] object-cover border"
            onError={handleImageError}
          />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>
          <p className="text-green-600 text-2xl font-semibold">
            {formatPrice(product.price)}
          </p>
          <p className="text-gray-500 text-sm">
            Terjual: {product.total_sold}+
          </p>
          <div className="flex items-center gap-1 text-yellow-500">
            {"★".repeat(Math.round(avgRating))}
            {"☆".repeat(5 - Math.round(avgRating))}
          </div>
          {product.is_bestseller && (
            <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
              Terlaris
            </span>
          )}
          {product.is_featured && (
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium ml-2">
              Baru
            </span>
          )}
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            {product.description}
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Ukuran</label>
              <select
                className="w-full border rounded p-2"
                value={size}
                onChange={(e) => handleFormChange("size", e.target.value)}
              >
                <option value="S">Small</option>
                <option value="M">Medium</option>
                <option value="L">Large</option>
                <option value="XL">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Jumlah</label>
              <div className="flex items-center border rounded w-full">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-12 h-10 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-full h-10 px-3 text-center"
                  min="1"
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-12 h-10 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <AddToCartButton
              product={product}
              disabled={!isValid()}
              customization={{ size, quantity }}
            />
            <BuyButton
              product={product}
              disabled={!isValid()}
              customization={{ size, quantity }}
            />
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Ulasan Pelanggan</h2>

        {/* Rating Summary */}
        <div className="flex flex-col md:flex-row gap-6 mb-6 border-b pb-6">
          <div className="md:w-1/4 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-amber-500">
              {displayRating}
            </div>
            <div className="flex text-yellow-400 text-xl my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star}>
                  {star <= Math.round(avgRating) ? "★" : "☆"}
                </span>
              ))}
            </div>
            <div className="text-gray-500 text-sm">
              {reviews.length} {reviews.length === 1 ? "ulasan" : "ulasan"}
            </div>
          </div>

          <div className="md:w-2/4">
            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center">
                  <div className="w-12 text-sm">{rating} star</div>
                  <div className="flex-1 mx-2 h-3 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full"
                      style={{ width: `${calculateRatingPercentage(rating)}%` }}
                    ></div>
                  </div>
                  <div className="w-9 text-xs text-right">
                    {ratingCounts[rating]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:w-1/4 flex flex-col items-start justify-center">
            <p className="text-gray-700 mb-2">Pernah membeli produk ini?</p>
            <Link
              href="/profile/Reviews"
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
            >
              Tulis Ulasan
            </Link>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Belum ada ulasan untuk produk ini.
          </div>
        ) : (
          <div className="space-y-3">
            {reviewsLoading ? (
              <div className="space-y-4">
                {/* Skeleton Loading */}
                <div className="skeleton-card bg-gray-100 h-20 rounded animate-pulse"></div>
                <div className="skeleton-card bg-gray-100 h-20 rounded animate-pulse"></div>
                <div className="skeleton-card bg-gray-100 h-20 rounded animate-pulse"></div>
              </div>
            ) : reviewsToDisplay.length > 0 ? (
              <>
                {reviewsToDisplay.map((r, i) => (
                  <ReviewProductCard
                    key={i}
                    user={r.user}
                    rating={r.rating}
                    comment={r.comment}
                    date={
                      r.createdAt || r.updatedAt || new Date().toISOString()
                    }
                    avatar={r.avatar}
                  />
                ))}

                {/* Tambah tombol review jika belum ada review dari user */}
                <div className="mt-6 text-center">
                  <Link
                    href="/profile/Reviews"
                    className="inline-block bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition-colors"
                  >
                    Tambah Review Baru
                  </Link>
                </div>
              </>
            ) : (
              <div className="p-6 text-center border rounded-lg">
                <p className="text-gray-500 mb-2">
                  Belum ada ulasan untuk produk ini
                </p>
                <Link
                  href="/profile/Reviews"
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  Jadilah yang pertama mengulas
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {reviewsToDisplay.length > 0 && totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleShowMore}
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            {currentPage < totalPages
              ? "Lihat Lebih Banyak"
              : "Kembali ke Awal"}
          </button>
        </div>
      )}
    </div>
  );
}
