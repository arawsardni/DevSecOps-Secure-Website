"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPurchasedProducts, getProductReviews } from "@/services/api";
import ReviewForm from "@/components/ReviewForm";
import { formatRupiah } from "@/utils/formatters";

export default function ProductReviewsPage() {
  const router = useRouter();
  const [purchasedProducts, setPurchasedProducts] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
      }
      return !!token;
    };

    const fetchData = async () => {
      if (!checkAuth()) return;

      try {
        setLoading(true);
        const userId = localStorage.getItem("user_id");
        if (!userId) {
          throw new Error("User ID tidak ditemukan");
        }

        // Ambil produk yang telah dibeli
        const products = await getPurchasedProducts(userId);
        console.log("Purchased products:", products);

        // Cache produk ini agar bisa diakses dari halaman produk detail
        try {
          // Simpan products ke localStorage untuk digunakan sebagai fallback
          const existingCache = localStorage.getItem("products_cache");
          let productsCache = existingCache ? JSON.parse(existingCache) : [];

          // Tambahkan produk-produk baru ke cache
          products.forEach((product) => {
            const productId = product.id || product.product_id;
            // Cek apakah produk sudah ada di cache
            const existingProductIndex = productsCache.findIndex(
              (p) => p.id === productId || p.product_id === productId
            );

            if (existingProductIndex === -1) {
              // Tambahkan produk baru ke cache
              productsCache.push({
                ...product,
                id: productId,
                name: product.title || product.name || "Produk",
                image_url:
                  product.image ||
                  product.image_url ||
                  product.product_detail?.image_url,
              });
            }
          });

          // Simpan kembali ke localStorage
          localStorage.setItem("products_cache", JSON.stringify(productsCache));
        } catch (cacheError) {
          console.error("Error caching products:", cacheError);
          // Lanjut meskipun error, karena ini hanya optimasi
        }

        setPurchasedProducts(products);

        // Ambil review yang sudah ada untuk setiap produk
        const reviewsObj = {};
        await Promise.all(
          products.map(async (product) => {
            const productId = product.id || product.product_id;
            const productReviews = await getProductReviews(productId);
            const userReview = productReviews.find(
              (review) => review.userId === userId
            );
            if (userReview) {
              reviewsObj[productId] = userReview;
            }
          })
        );

        setReviews(reviewsObj);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Fungsi untuk mendapatkan URL gambar yang valid
  const getValidImageUrl = (product) => {
    // Coba berbagai kemungkinan field gambar (karena format data produk berbeda-beda)
    const imageUrl =
      product.image ||
      product.image_url ||
      product.product_detail?.image_url ||
      "";

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

  const handleReviewSubmitted = async () => {
    // Refresh reviews setelah submit
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    try {
      const reviewsObj = { ...reviews };
      await Promise.all(
        purchasedProducts.map(async (product) => {
          const productId = product.id || product.product_id;
          const productReviews = await getProductReviews(productId);
          const userReview = productReviews.find(
            (review) => review.userId === userId
          );
          if (userReview) {
            reviewsObj[productId] = userReview;
          }
        })
      );

      setReviews(reviewsObj);
      setSelectedProduct(null); // Tutup form review
    } catch (err) {
      console.error("Error refreshing reviews:", err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Review Produk</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded w-full"></div>
          <div className="h-32 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Review Produk</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Review Produk</h1>
      {purchasedProducts.length === 0 ? (
        <div className="bg-yellow-50 text-yellow-700 p-6 rounded-lg text-center">
          <p className="mb-4">Anda belum pernah membeli produk apapun.</p>
          <Link
            href="/Product"
            className="inline-block bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition-colors"
          >
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-gray-600">
            Berikut adalah produk yang telah Anda beli. Anda dapat menambahkan
            review untuk setiap produk.
          </p>

          {selectedProduct && (
            <div className="mb-6">
              <ReviewForm
                productId={selectedProduct.id || selectedProduct.product_id}
                productName={selectedProduct.title || selectedProduct.name}
                originalProduct={selectedProduct}
                onReviewSubmitted={handleReviewSubmitted}
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="mt-4 text-gray-500 hover:text-gray-700"
              >
                Batal
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {purchasedProducts.map((product) => {
              const productId = product.id || product.product_id;
              const hasReviewed = !!reviews[productId];
              const reviewData = reviews[productId];

              return (
                <div
                  key={productId}
                  className="border rounded-lg p-4 bg-white shadow-sm flex flex-col md:flex-row items-center md:items-start gap-4"
                >
                  <img
                    src={getValidImageUrl(product)}
                    alt={product.title || product.name}
                    className="w-24 h-24 object-cover rounded"
                    onError={(e) => {
                      // Avoid infinite loop
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/placeholder.jpg";
                    }}
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {product.title || product.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {product.size && `Ukuran: ${product.size}`}
                    </p>
                    <p className="text-amber-600 font-medium">
                      {formatPrice(product.price)}
                    </p>

                    {hasReviewed ? (
                      <div className="mt-3 bg-gray-50 p-3 rounded">
                        <div className="flex items-center mb-1">
                          <span className="text-yellow-500 mr-1">
                            {"★".repeat(reviewData.rating)}
                            {"☆".repeat(5 - reviewData.rating)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({reviewData.rating}/5)
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {reviewData.comment}
                        </p>
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit Review
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="mt-3 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors text-sm"
                      >
                        Tambah Review
                      </button>
                    )}
                  </div>

                  <div>
                    <Link
                      href={`/Product/${productId}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={(e) => {
                        // Tambahkan validasi ID sebelum mengalihkan
                        if (!productId) {
                          e.preventDefault();
                          alert("ID produk tidak valid");
                          return;
                        }

                        // Pastikan ID dalam format yang valid (string) dan simpan untuk referensi
                        const productIdStr = String(productId);
                        console.log(
                          "Navigating to product with ID:",
                          productIdStr
                        );

                        // Tambahkan ID ke URL tanpa modifier khusus
                        e.currentTarget.href = `/Product/${productIdStr}`;
                      }}
                    >
                      Lihat Produk
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
