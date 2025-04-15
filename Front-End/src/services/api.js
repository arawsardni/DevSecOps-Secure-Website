// Menggunakan URL yang berbeda berdasarkan environment
// - Di browser pengguna: http://localhost:8000/api
// - Di dalam container: http://backend:8000/api
const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_BROWSER_API_URL || "http://localhost:8000/api") 
  : (process.env.NEXT_PUBLIC_API_URL || "http://backend:8000/api");

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
export const loginUser = async (credentials) => {
  try {
    // Extract email and password correctly to avoid nested objects
    const { email, password } = credentials;
    
    // Ensure we're sending a properly formatted object
    const loginData = { email, password };
    
    console.log('Logging in user:', email);
    console.log('Login payload:', JSON.stringify(loginData));
    
    const response = await fetch(`${API_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    // Get the raw text first for better debugging
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    // Try to parse as JSON
    let data;
    let ok = response.ok;
    
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("Error parsing response:", error);
      throw new Error("Server returned invalid response");
    }
    
    if (!ok) {
      // Extract error message from response
      let errorMessage = 'Login failed';
      
      if (data) {
        // Check all possible error field names
        if (data.detail) {
          errorMessage = typeof data.detail === 'object' 
            ? JSON.stringify(data.detail) 
            : data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.non_field_errors) {
          errorMessage = data.non_field_errors[0];
        }
      }
      
      console.error('Login error details:', data);
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
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

    console.log("Fetching purchased products for user:", userId);
    
    // Gunakan endpoint baru untuk produk yang pernah dibeli
    const apiUrl = `${API_URL}/orders/user/${userId}/purchased-products/`;
    console.log("API URL:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Log response status dan headers
    console.log("Response status:", response.status);

    if (!response.ok) {
      // Coba baca response sebagai text untuk melihat apa yang sebenarnya dikembalikan
      const responseText = await response.text();
      console.error("Error response text:", responseText);

      // Jika API gagal, fallback ke metode lama
      console.log("API gagal, mencoba metode alternatif untuk mendapatkan produk...");
      const oldApiUrl = `${API_URL}/orders/user/${userId}/completed/`;
      
      try {
        const oldResponse = await fetch(oldApiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (!oldResponse.ok) {
          throw new Error(`Error dengan status: ${oldResponse.status}`);
        }
        
        const orders = await oldResponse.json();
        return processCompletedOrdersForProducts(orders);
      } catch (oldApiError) {
        console.error("Error dengan API alternatif:", oldApiError);
        // Fallback ke localStorage jika kedua API gagal
        return getLocalPurchasedProducts(userId);
      }
    }

    const products = await response.json();
    console.log("Purchased products from API:", products);
    
    // Process image URLs in the products
    const processedProducts = products.map(product => {
      // Create a copy of the product to avoid modifying the original
      const processedProduct = { ...product };
      
      // Process image URLs
      if (processedProduct.image) {
        processedProduct.image = processImageUrl(processedProduct.image);
      }
      
      if (processedProduct.image_url) {
        processedProduct.image_url = processImageUrl(processedProduct.image_url);
      }
      
      return processedProduct;
    });
    
    return processedProducts;
  } catch (error) {
    console.error("Error fetching purchased products:", error);
    // Fallback ke localStorage jika API gagal
    return getLocalPurchasedProducts(userId);
  }
};

// Helper function to process image URLs
function processImageUrl(url) {
  if (!url) return null;
  
  // If already a complete URL, return as is
  if (url.startsWith('http')) {
    return url;
  }
  
  try {
    // Get the base URL (without /api)
    const apiUrl = API_URL;
    const baseUrl = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_BROWSER_BASE_URL || apiUrl.replace('/api', '')) 
      : (process.env.NEXT_PUBLIC_BASE_URL || apiUrl.replace('/api', ''));
    
    // Clean the URL path
    let cleanUrl = url;
    if (cleanUrl.startsWith('/api/')) {
      cleanUrl = cleanUrl.substring(4);
    }
    
    // Ensure it has the proper /media prefix if needed
    if (!cleanUrl.startsWith('/media/') && !cleanUrl.startsWith('/')) {
      cleanUrl = '/media/' + cleanUrl;
    } else if (!cleanUrl.startsWith('/')) {
      cleanUrl = '/' + cleanUrl;
    }
    
    return `${baseUrl}${cleanUrl}`;
  } catch (error) {
    console.error('Error processing image URL:', error, url);
    return url; // Return original if processing fails
  }
}

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

// Product Reviews API
export const getProductReviews = async (productId) => {
  try {
    // Ensure productId is valid
    if (!productId) {
      console.warn("Invalid product ID for reviews");
      return [];
    }
    
    console.log("Fetching reviews for product ID:", productId);
    
    // Connect to backend API
    const response = await fetch(`${API_URL}/reviews/products/${productId}/`);
    
    if (!response.ok) {
      console.error("Failed to fetch reviews:", response.status);
      // Fallback to localStorage if API fails
      return getProductReviewsFromLocalStorage(productId);
    }
    
    const responseData = await response.json();
    
    // Format the backend response to match our frontend format
    const reviews = responseData.reviews.map(review => ({
      id: review.id,
      productId: review.product,
      userId: review.user,
      user: review.user_detail?.name || "Anonymous",
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      avatar: review.user_detail?.avatar || null,
      isApproved: review.is_approved,
      isFeatured: review.is_featured,
      likesCount: review.likes_count
    }));
    
    console.log(`Found ${reviews.length} reviews for product ${productId}`);
    
    // Also save to localStorage for offline access
    try {
      const allReviews = JSON.parse(localStorage.getItem("product_reviews") || "[]");
      
      // Remove any existing reviews for this product
      const filteredReviews = allReviews.filter(review => 
        String(review.productId) !== String(productId)
      );
      
      // Add the new reviews
      const updatedReviews = [...filteredReviews, ...reviews];
      localStorage.setItem("product_reviews", JSON.stringify(updatedReviews));
    } catch (err) {
      console.error("Error saving reviews to localStorage:", err);
    }
    
    return reviews;
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    // Fallback to localStorage
    return getProductReviewsFromLocalStorage(productId);
  }
};

// Helper function to get reviews from localStorage (fallback)
const getProductReviewsFromLocalStorage = (productId) => {
  try {
    // Get from localStorage
    const reviewsData = localStorage.getItem("product_reviews");
    let reviews = reviewsData ? JSON.parse(reviewsData) : [];

    // Convert productId to string for consistent comparison
    const targetId = String(productId);
    console.log("Fetching reviews from localStorage for product ID:", targetId);

    // Filter review based on productId
    return reviews.filter(review => {
      // Check direct ID match
      if (String(review.productId) === targetId) return true;

      // Check alternative IDs
      if (review.alternate_product_ids && Array.isArray(review.alternate_product_ids)) {
        if (review.alternate_product_ids.includes(targetId)) return true;
      }

      // Check alternate_ids
      if (review.alternate_ids && Array.isArray(review.alternate_ids)) {
        if (review.alternate_ids.includes(targetId)) return true;
      }

      return false;
    });
  } catch (error) {
    console.error("Error getting reviews from localStorage:", error);
    return [];
  }
};

export const addProductReview = async (reviewData) => {
  try {
    // Validate review data
    if (!reviewData.productId || !reviewData.rating) {
      throw new Error("Incomplete review data");
    }
    
    // Get user token
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("You must be logged in to leave a review");
    }
    
    console.log("Adding review for product ID:", reviewData.productId);
    
    // Format data for the backend
    const backendData = {
      product: reviewData.productId,
      rating: reviewData.rating,
      comment: reviewData.comment || ""
    };
    
    // Post to the backend
    const response = await fetch(`${API_URL}/reviews/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(backendData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.error || "Failed to submit review");
    }
    
    // Get the response with the created review
    const createdReview = await response.json();
    
    // Format for frontend use
    const formattedReview = {
      id: createdReview.id,
      productId: createdReview.product,
      userId: createdReview.user,
      user: createdReview.user_detail?.name || "Anonymous",
      rating: createdReview.rating,
      comment: createdReview.comment,
      createdAt: createdReview.created_at,
      updatedAt: createdReview.updated_at,
      avatar: createdReview.user_detail?.avatar || null,
      isApproved: createdReview.is_approved,
      isFeatured: createdReview.is_featured,
      likesCount: createdReview.likes_count
    };
    
    // Also save to localStorage as a backup
    try {
      const reviewsData = localStorage.getItem("product_reviews");
      let reviews = reviewsData ? JSON.parse(reviewsData) : [];
      
      // Remove any existing review by this user for this product
      reviews = reviews.filter(review => 
        !(String(review.productId) === String(reviewData.productId) && 
          String(review.userId) === String(reviewData.userId))
      );
      
      // Add the new review
      reviews.push(formattedReview);
      localStorage.setItem("product_reviews", JSON.stringify(reviews));
    } catch (err) {
      console.error("Error saving review to localStorage:", err);
    }
    
    return formattedReview;
  } catch (error) {
    console.error("Error adding product review:", error);
    throw error;
  }
};

export const createTestOrders = async (token) => {
  try {
    if (!token) {
      throw new Error("Token tidak ditemukan");
    }

    const response = await fetch(`${API_URL}/orders/create-test-orders/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    // Log for debugging
    console.log("Create test orders response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      let errorMessage = "Gagal membuat pesanan test";
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        // If not JSON, use the raw text
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating test orders:", error);
    throw error;
  }
};

// Helper function to process completed orders and extract unique products
const processCompletedOrdersForProducts = (orders) => {
  // Ekstrak semua produk yang telah dibeli
  const purchasedProducts = [];
  const productIds = new Set();
  
  orders.forEach((order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        if (item.product && !productIds.has(item.product.id)) {
          productIds.add(item.product.id);
          
          // Process image URLs before adding to list
          let image = item.product.image_url || item.product.image;
          if (image) {
            image = processImageUrl(image);
          }
          
          purchasedProducts.push({
            id: item.product.id,
            name: item.product.name,
            title: item.product.name,
            price: item.price,
            image: image,
            image_url: image,
            size: item.size,
            quantity: item.quantity,
            product_id: item.product.id,
          });
        }
      });
    }
  });
  
  console.log("Processed purchased products from orders:", purchasedProducts);
  return purchasedProducts;
};
