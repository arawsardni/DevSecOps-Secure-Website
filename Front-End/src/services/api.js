const API_URL = "http://localhost:8000/api";

export const getProducts = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_URL}/products/?${queryParams}`);
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  return response.json();
};

export const getProductById = async (id) => {
  try {
    if (!id) {
      throw new Error("Product ID tidak valid");
    }

    // Coba untuk mengonversi ID jika itu adalah objek atau format yang berbeda
    let productId = id;
    if (typeof id === "object" && id !== null) {
      // Jika id adalah objek, coba ambil id atau product_id
      productId = id.id || id.product_id;
    }

    // Pastikan ID valid
    if (!productId) {
      throw new Error("Product ID tidak valid");
    }

    console.log("Fetching product with ID:", productId);

    // Cek dulu di cache sebelum mencoba API
    try {
      const allProductsStr = localStorage.getItem("products_cache");
      if (allProductsStr) {
        const allProducts = JSON.parse(allProductsStr);
        const cachedProduct = allProducts.find(
          (p) =>
            String(p.id) === String(productId) ||
            String(p.product_id) === String(productId)
        );
        if (cachedProduct) {
          console.log("Product found in cache:", cachedProduct);
          return cachedProduct;
        }
      }
    } catch (cacheError) {
      console.warn("Error checking product cache:", cacheError);
      // Lanjut ke API jika cache error
    }

    // Jika tidak ada di cache, coba ambil dari API
    try {
      const response = await fetch(`${API_URL}/products/${productId}/`);
      if (!response.ok) {
        throw new Error("Product not found in API");
      }

      const data = await response.json();

      // Kembalikan data dari API jika valid
      if (data && data.name) {
        return data;
      }
      throw new Error("Invalid product data from API");
    } catch (apiError) {
      console.warn("API fetch error:", apiError);

      // Jika API gagal, coba sekali lagi dari cache
      const allProductsStr = localStorage.getItem("products_cache");
      if (allProductsStr) {
        const allProducts = JSON.parse(allProductsStr);
        const cachedProduct = allProducts.find(
          (p) =>
            String(p.id) === String(productId) ||
            String(p.product_id) === String(productId)
        );
        if (cachedProduct) {
          console.log(
            "Product found in cache after API failure:",
            cachedProduct
          );
          return cachedProduct;
        }
      }

      // Jika masih tidak ditemukan, lempar error
      throw new Error("Failed to fetch product");
    }
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    throw new Error("Failed to fetch product");
  }
};

export const getCategories = async () => {
  const response = await fetch(`${API_URL}/products/categories/`);
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
};

// Auth API
export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  return response.json();
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Registration failed");
  }

  return response.json();
};

export const logoutUser = async (token) => {
  const response = await fetch(`${API_URL}/auth/logout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Logout failed");
  }

  return response.json();
};

// Profile API
export const getUserProfile = async (token) => {
  try {
    const response = await fetch(`${API_URL}/auth/profile/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch profile");
    }

    const data = await response.json();
    console.log("User profile response:", data);

    // Pastikan URL avatar lengkap dengan path yang benar
    if (data.avatar) {
      // Avatar URL dari backend biasanya berupa path relatif seperti '/media/uploads/avatars/wahyu.jpg'
      // Backend mengirimkan URL relatif tanpa host, jadi kita perlu menambahkan API_URL
      if (!data.avatar.startsWith("http")) {
        // Hapus '/api' jika ada di awal path (karena API_URL sudah mengandung /api)
        if (data.avatar.startsWith("/api/")) {
          data.avatar = data.avatar.substring(4); // Hapus '/api' dari awal
        }

        // Pastikan URL dimulai dengan garis miring
        if (!data.avatar.startsWith("/")) {
          data.avatar = "/" + data.avatar;
        }

        // Gabungkan dengan base URL API
        data.avatar = API_URL + data.avatar;
      }
      console.log("Final avatar URL:", data.avatar);
    }

    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

export const updateUserProfile = async (token, formData) => {
  try {
    // Debug isi FormData
    console.log("FormData entries:");
    for (let pair of formData.entries()) {
      console.log(
        pair[0] + ": " + (pair[0] === "avatar" ? "File object" : pair[1])
      );
    }

    const response = await fetch(`${API_URL}/auth/profile/update/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Gagal memperbarui profil");
    }

    // Debug hasil respons
    const data = await response.json();
    console.log("Update profile response:", data);

    // Pastikan URL avatar lengkap dengan path yang benar
    if (data.avatar) {
      // Avatar URL dari backend biasanya berupa path relatif seperti '/media/uploads/avatars/wahyu.jpg'
      // Backend mengirimkan URL relatif tanpa host, jadi kita perlu menambahkan API_URL
      if (!data.avatar.startsWith("http")) {
        // Hapus '/api' jika ada di awal path (karena API_URL sudah mengandung /api)
        if (data.avatar.startsWith("/api/")) {
          data.avatar = data.avatar.substring(4); // Hapus '/api' dari awal
        }

        // Pastikan URL dimulai dengan garis miring
        if (!data.avatar.startsWith("/")) {
          data.avatar = "/" + data.avatar;
        }

        // Gabungkan dengan base URL API
        data.avatar = API_URL + data.avatar;
      }
      console.log("Final avatar URL:", data.avatar);
    }

    // Pastikan data alamat diproses dengan benar
    if (data.addresses) {
      try {
        // Jika addresses adalah string JSON, parse menjadi array
        if (typeof data.addresses === "string") {
          data.addresses = JSON.parse(data.addresses);
        }
        console.log("Processed addresses:", data.addresses);
      } catch (error) {
        console.error("Error processing addresses:", error);
        data.addresses = [];
      }
    }

    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

export const updateUserAddresses = async (token, addressData) => {
  const response = await fetch(`${API_URL}/auth/profile/addresses/update/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(addressData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update addresses");
  }

  return response.json();
};

// Review API
export const getPurchasedProducts = async (userId) => {
  try {
    // Validasi userId
    if (!userId) {
      console.warn("User ID tidak valid");
      return [];
    }

    // Coba ambil token dari beberapa lokasi yang mungkin
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token");

    if (!token) {
      console.warn("Token tidak ditemukan di localStorage");
      return [];
    }

    // Cek apakah user yang login sesuai dengan userId yang diminta
    const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
    if (userData.id !== userId) {
      console.warn("User ID tidak sesuai dengan user yang login");
      return [];
    }

    console.log("Fetching purchased products for user:", userId);
    console.log("Using token:", token);

    // Perbaiki URL endpoint dari /order/ menjadi /orders/
    const apiUrl = `${API_URL}/orders/user/${userId}/completed/`;
    console.log("API URL:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Log response status dan headers
    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      // Coba baca response sebagai text untuk melihat apa yang sebenarnya dikembalikan
      const responseText = await response.text();
      console.error("Error response text:", responseText);

      // Coba parse sebagai JSON jika mungkin
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.detail || "Gagal mengambil data pesanan");
      } catch (parseError) {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }
    }

    const orders = await response.json();
    console.log("Orders from backend:", orders);

    // Jika tidak ada pesanan yang selesai, coba ambil dari localStorage
    if (!orders || orders.length === 0) {
      console.log("Tidak ada pesanan dari backend, mencoba dari localStorage");
      return getLocalPurchasedProducts(userId);
    }

    // Ekstrak semua produk yang telah dibeli
    const purchasedProducts = [];
    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.product) {
            // Tambahkan ke daftar jika belum ada
            const existingProduct = purchasedProducts.find(
              (p) => p.id === item.product.id
            );
            if (!existingProduct) {
              purchasedProducts.push({
                id: item.product.id,
                name: item.product.name,
                title: item.product.name,
                price: item.price,
                image: item.product.image_url || item.product.image,
                size: item.size,
                quantity: item.quantity,
                product_id: item.product.id,
              });
            }
          }
        });
      }
    });

    console.log("Processed purchased products:", purchasedProducts);
    return purchasedProducts;
  } catch (error) {
    console.error("Error fetching purchased products:", error);
    // Fallback ke localStorage jika API gagal
    return getLocalPurchasedProducts(userId);
  }
};

// Fungsi helper untuk mengambil produk dari localStorage
const getLocalPurchasedProducts = (userId) => {
  try {
    console.log(
      "Fetching purchased products from localStorage for user:",
      userId
    );

    // Mendapatkan riwayat pesanan dari localStorage berdasarkan user_id
    const ordersKey = `orders_${userId}`;
    const ordersData = localStorage.getItem(ordersKey);

    if (!ordersData) {
      return [];
    }

    const orders = JSON.parse(ordersData);

    // Filter hanya pesanan yang sudah selesai (completed)
    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    );

    // Ekstrak semua produk yang telah dibeli
    const purchasedProducts = [];
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        // Tambahkan ke daftar jika belum ada
        if (
          !purchasedProducts.some(
            (p) => p.id === item.id || p.product_id === item.product_id
          )
        ) {
          purchasedProducts.push(item);
        }
      });
    });

    console.log(
      "Processed purchased products from localStorage:",
      purchasedProducts
    );
    return purchasedProducts;
  } catch (error) {
    console.error(
      "Error fetching purchased products from localStorage:",
      error
    );
    return [];
  }
};

export const getProductReviews = async (productId) => {
  try {
    // Ambil dari localStorage
    const reviewsData = localStorage.getItem("product_reviews");
    let reviews = reviewsData ? JSON.parse(reviewsData) : [];

    // Konversi productId ke string untuk perbandingan yang konsisten
    const targetId = String(productId);
    console.log("Fetching reviews for product ID:", targetId);

    // Filter review berdasarkan productId dengan perbandingan yang lebih fleksibel
    const productReviews = reviews.filter((review) => {
      // Cek ID langsung
      if (String(review.productId) === targetId) return true;

      // Cek ID alternatif
      if (
        review.alternate_product_ids &&
        Array.isArray(review.alternate_product_ids)
      ) {
        if (review.alternate_product_ids.includes(targetId)) return true;
      }

      // Cek alternate_ids
      if (review.alternate_ids && Array.isArray(review.alternate_ids)) {
        if (review.alternate_ids.includes(targetId)) return true;
      }

      // Cek format lama
      if (String(review.product_id) === targetId) return true;

      return false;
    });

    console.log(
      `Found ${productReviews.length} reviews for product ${targetId}`
    );
    return productReviews;
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return [];
  }
};

export const addProductReview = async (reviewData) => {
  try {
    // Validasi data review
    if (!reviewData.productId || !reviewData.userId || !reviewData.rating) {
      throw new Error("Data review tidak lengkap");
    }

    // Standardisasi productId sebagai string
    reviewData.productId = String(reviewData.productId);
    console.log("Adding review for product ID:", reviewData.productId);

    // Tambahkan avatar pengguna jika tersedia
    try {
      const userData = JSON.parse(localStorage.getItem("user_data"));
      if (userData && userData.avatar) {
        reviewData.avatar = userData.avatar;
      }
    } catch (err) {
      console.error("Error adding avatar to review:", err);
    }

    // Tambahkan ke cache produk untuk konsistensi ID
    try {
      const productsCache = JSON.parse(
        localStorage.getItem("products_cache") || "[]"
      );
      // Catat bahwa product ID ini sudah direview
      localStorage.setItem("last_reviewed_product_id", reviewData.productId);

      // Cari ID produk alternatif dari cache jika ada
      const cachedProduct = productsCache.find(
        (p) =>
          String(p.id) === reviewData.productId ||
          String(p.product_id) === reviewData.productId
      );

      if (cachedProduct) {
        // Simpan product_ids alternatif dalam review untuk matching yang lebih baik nanti
        reviewData.alternate_ids = [
          String(cachedProduct.id || ""),
          String(cachedProduct.product_id || ""),
        ].filter((id) => id);
      }
    } catch (err) {
      console.error("Error checking product cache for review:", err);
    }

    // Ambil review yang sudah ada
    const reviewsData = localStorage.getItem("product_reviews");
    let reviews = reviewsData ? JSON.parse(reviewsData) : [];

    // Cek apakah user sudah pernah mereview produk ini
    const existingReviewIndex = reviews.findIndex(
      (review) =>
        review.productId === reviewData.productId &&
        review.userId === reviewData.userId
    );

    // Jika sudah ada, update review
    if (existingReviewIndex !== -1) {
      reviews[existingReviewIndex] = {
        ...reviews[existingReviewIndex],
        ...reviewData,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Jika belum, tambahkan review baru
      reviews.push({
        ...reviewData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Simpan kembali ke localStorage
    localStorage.setItem("product_reviews", JSON.stringify(reviews));

    return reviewData;
  } catch (error) {
    console.error("Error adding product review:", error);
    throw error;
  }
};
