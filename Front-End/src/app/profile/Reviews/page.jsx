"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPurchasedProducts,
  getProductReviews,
  createTestOrders,
} from "@/services/api";
import ReviewForm from "@/components/ReviewForm";
import { formatRupiah } from "@/utils/formatters";
import { toast } from "react-hot-toast";

export default function ProductReviewsPage() {
  const router = useRouter();
  const [purchasedProducts, setPurchasedProducts] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCreatingTestOrders, setIsCreatingTestOrders] = useState(false);

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

  const fetchData = async () => {
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
      }
      return !!token;
    };

    if (!checkAuth()) return;

    try {
      setLoading(true);
      const userId = localStorage.getItem("user_id");

      if (!userId) {
        throw new Error("User ID tidak ditemukan");
      }

      // Ambil produk yang telah dibeli dengan API baru
      console.log("Fetching purchased products from backend API");
      const purchasedProductsData = await getPurchasedProducts(userId);
      console.log("Received purchased products:", purchasedProductsData);

      // Menyimpan data produk yang dibeli
      setPurchasedProducts(purchasedProductsData);

      // Cache produk ini agar bisa diakses dari halaman produk detail
      try {
        // Simpan products ke localStorage untuk digunakan sebagai fallback
        const existingCache = localStorage.getItem("products_cache");
        let productsCache = existingCache ? JSON.parse(existingCache) : [];

        // Tambahkan produk-produk baru ke cache
        purchasedProductsData.forEach((product) => {
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

      // Ambil review yang sudah ada untuk setiap produk
      const reviewsObj = {};
      await Promise.all(
        purchasedProductsData.map(async (product) => {
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

  useEffect(() => {
    fetchData();
  }, [router]);

  // Fungsi untuk mendapatkan URL gambar yang valid
  const getValidImageUrl = (product) => {
    // Coba berbagai kemungkinan field gambar (karena format data produk berbeda-beda)
    let imageUrl =
      product.image ||
      product.image_url ||
      (product.product_detail && product.product_detail.image_url) ||
      (product.thumbnail_images &&
        product.thumbnail_images.length > 0 &&
        product.thumbnail_images[0]) ||
      "";

    // Print debug info
    console.log("Product image data:", {
      product_id: product.id,
      name: product.name,
      image: product.image,
      image_url: product.image_url,
      thumbnail_images: product.thumbnail_images,
    });

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
        process.env.NEXT_PUBLIC_API_URL || "http://10.34.100.143:8000/api";
      const backendBaseUrl = apiUrl.replace("/api", ""); // Remove '/api' if present to get base URL

      // Hapus '/api' jika ada di awal path
      let cleanUrl = imageUrl;
      if (cleanUrl.startsWith("/api/")) {
        cleanUrl = cleanUrl.substring(4);
      }

      // Check if missing /media prefix
      if (!cleanUrl.startsWith("/media") && !cleanUrl.startsWith("/")) {
        cleanUrl = "/media/" + cleanUrl;
      } else if (!cleanUrl.startsWith("/")) {
        cleanUrl = "/" + cleanUrl;
      }

      // Gabungkan dengan base URL Backend (not API URL)
      return `${backendBaseUrl}${cleanUrl}`;
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

  const createTestOrdersHandler = async () => {
    setIsCreatingTestOrders(true);
    try {
      await createTestOrders();
      toast.success("Test orders created successfully!");
      await fetchData(); // Reload data after creating test orders
    } catch (error) {
      console.error("Error creating test orders:", error);
      toast.error(`Failed to create test orders: ${error.message}`);
    } finally {
      setIsCreatingTestOrders(false);
    }
  };

  if (loading || isCreatingTestOrders) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-8">Product Reviews</h1>
        {Array(4)
          .fill(0)
          .map((_, index) => (
            <div
              key={`loading-item-${index}`}
              className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse"
            >
              <div className="flex items-start">
                <div className="h-16 w-16 bg-gray-300 rounded-md mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Review Produk</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={fetchData}
          className="bg-brown-600 text-white px-4 py-2 rounded hover:bg-brown-700 mr-2"
        >
          Coba Lagi
        </button>
        {purchasedProducts.length === 0 && (
          <button
            onClick={createTestOrdersHandler}
            disabled={isCreatingTestOrders}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isCreatingTestOrders ? "Membuat Data Test..." : "Buat Data Test"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Review Produk</h1>

      {purchasedProducts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg mb-6">
            Anda belum pernah membeli produk apapun.
          </p>
          <div className="flex space-x-4 justify-center">
            <Link
              href="/products"
              className="bg-brown-600 text-white px-6 py-2 rounded-md hover:bg-brown-700"
            >
              Mulai Belanja
            </Link>
            <button
              onClick={createTestOrdersHandler}
              disabled={isCreatingTestOrders}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              {isCreatingTestOrders
                ? "Membuat Data Test..."
                : "Buat Data Test Untuk Review"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:gap-8">
          {selectedProduct ? (
            <div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="mb-4 flex items-center text-gray-600 hover:text-gray-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Kembali ke daftar produk
              </button>
              <ReviewForm
                productId={selectedProduct.id}
                productName={selectedProduct.name}
                onReviewSubmitted={handleReviewSubmitted}
              />
            </div>
          ) : (
            purchasedProducts.map((product) => {
              const productId = product.id || product.product_id;
              const hasReviewed = !!reviews[productId];

              return (
                <div
                  key={productId}
                  className="bg-white p-4 rounded-lg shadow-sm border flex flex-col md:flex-row gap-4 relative"
                >
                  <div className="flex-shrink-0">
                    <img
                      src={getValidImageUrl(product)}
                      alt={product.title || product.name}
                      className="w-24 h-24 object-cover rounded"
                      onError={(e) => {
                        // Avoid infinite loop by setting onerror to null
                        e.currentTarget.onerror = null;
                        // Provide a fallback image
                        e.currentTarget.src = "/images/placeholder.jpg";
                        // Log for debugging
                        console.log(
                          "Image loading failed for:",
                          product.title || product.name,
                          "URL:",
                          e.currentTarget.src
                        );
                      }}
                    />
                  </div>

                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg text-gray-800">
                      {product.title || product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {formatPrice(product.price)}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {product.description || "No description available"}
                    </p>

                    {hasReviewed ? (
                      <div className="mt-3">
                        <p className="text-green-600 text-sm font-medium">
                          Anda sudah memberikan review
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-yellow-500">
                            {"★".repeat(reviews[productId].rating)}
                            {"☆".repeat(5 - reviews[productId].rating)}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {reviews[productId].rating}/5
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {reviews[productId].comment}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 inline-flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Tulis Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
