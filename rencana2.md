# Rencana Migrasi Data dari LocalStorage ke Database Backend

## Tujuan

Memindahkan penyimpanan data penting dari localStorage ke database backend sambil mempertahankan flow aplikasi frontend yang sudah ada.

## Data yang Perlu Dimigrasi

1. **Keranjang Belanja (Cart & CartItem)**
2. **Pesanan (Orders & OrderItems)**
3. **Review Produk**

## Prinsip Umum

1. Tidak mengubah flow aplikasi di frontend
2. Memanfaatkan API backend yang sudah ada atau membuat yang baru bila diperlukan
3. Menerapkan prinsip backward compatibility untuk memudahkan migrasi bertahap

## Rencana Implementasi

### Fase 1: Cart & CartItem

#### Backend (Persiapan API)

1. **Implementasi API Cart**

   - `GET /api/cart/` - Mendapatkan cart pengguna saat ini
   - `POST /api/cart/items/` - Menambah item ke cart
   - `PUT /api/cart/items/:id/` - Update item cart (kuantitas, ukuran, dll)
   - `DELETE /api/cart/items/:id/` - Hapus item dari cart
   - `GET /api/cart/clear/` - Kosongkan cart

2. **Modifikasi model CartItem**
   - Tambahkan field tambahan sesuai yang ada di localStorage:
     ```python
     # Tambahan field di CartItem model
     size = models.CharField(max_length=2, choices=Product.SIZE_CHOICES, null=True, blank=True)
     sugar = models.CharField(max_length=20, null=True, blank=True)
     ice = models.CharField(max_length=20, null=True, blank=True)
     shots = models.PositiveIntegerField(default=0, null=True, blank=True)
     special_instructions = models.TextField(blank=True, null=True)
     ```

#### Frontend (Implementasi API)

1. **Modifikasi Services API**

   ```javascript
   // File: Front-End/src/services/api.js

   // New Cart API functions
   export const getCart = async (token) => {
     const response = await fetch(`${API_URL}/cart/`, {
       headers: {
         Authorization: `Bearer ${token}`,
       },
     });

     if (!response.ok) {
       throw new Error("Failed to fetch cart");
     }

     return response.json();
   };

   export const addToCart = async (token, productData) => {
     const response = await fetch(`${API_URL}/cart/items/`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
       },
       body: JSON.stringify(productData),
     });

     if (!response.ok) {
       throw new Error("Failed to add item to cart");
     }

     return response.json();
   };

   export const updateCartItem = async (token, itemId, updateData) => {
     const response = await fetch(`${API_URL}/cart/items/${itemId}/`, {
       method: "PUT",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
       },
       body: JSON.stringify(updateData),
     });

     if (!response.ok) {
       throw new Error("Failed to update cart item");
     }

     return response.json();
   };

   export const removeFromCart = async (token, itemId) => {
     const response = await fetch(`${API_URL}/cart/items/${itemId}/`, {
       method: "DELETE",
       headers: {
         Authorization: `Bearer ${token}`,
       },
     });

     if (!response.ok) {
       throw new Error("Failed to remove item from cart");
     }

     return response.json();
   };

   export const clearCart = async (token) => {
     const response = await fetch(`${API_URL}/cart/clear/`, {
       method: "POST",
       headers: {
         Authorization: `Bearer ${token}`,
       },
     });

     if (!response.ok) {
       throw new Error("Failed to clear cart");
     }

     return response.json();
   };
   ```

2. **Implementasi Hybrid Storage**

   ```javascript
   // File: Front-End/src/services/cartService.js

   // Hybrid storage untuk keranjang - menggunakan localStorage sebagai fallback
   import * as api from "./api";

   // Tambahkan item ke keranjang
   export const addCartItem = async (productData) => {
     try {
       const token = localStorage.getItem("access_token");
       const userId = localStorage.getItem("user_id");

       if (token) {
         // Simpan ke backend jika user login
         const response = await api.addToCart(token, productData);

         // Update localStorage sebagai cache
         updateLocalCart(userId, response.cart);

         return response;
       } else {
         // Jika tidak login, gunakan localStorage saja
         return addToLocalCart(userId, productData);
       }
     } catch (error) {
       console.error("Error adding to cart:", error);
       // Fallback ke localStorage
       const userId = localStorage.getItem("user_id");
       return addToLocalCart(userId, productData);
     }
   };

   // Helper functions untuk localStorage
   const getLocalCart = (userId) => {
     const cartKey = userId ? `cart_${userId}` : "cart";
     const cartData = localStorage.getItem(cartKey);
     return cartData ? JSON.parse(cartData) : [];
   };

   const updateLocalCart = (userId, cartItems) => {
     const cartKey = userId ? `cart_${userId}` : "cart";
     localStorage.setItem(cartKey, JSON.stringify(cartItems));
   };

   const addToLocalCart = (userId, productData) => {
     const cart = getLocalCart(userId);
     // Logic untuk menambah/update item di cart
     // ... (implementasi sama seperti yang sudah ada)

     updateLocalCart(userId, cart);
     return { cart };
   };

   // Implementasikan fungsi serupa untuk: updateCartItem, removeCartItem, clearCart, getCart
   ```

3. **Modifikasi Komponen Keranjang (Cart)**

   ```javascript
   // File: Front-End/src/app/Cart/page.jsx

   import { useEffect, useState } from "react";
   import { useRouter } from "next/navigation";
   import * as cartService from "@/services/cartService";

   export default function Cart() {
     // ...existing code...

     useEffect(() => {
       const fetchCartItems = async () => {
         try {
           // Gunakan cartService yang baru
           const { cart } = await cartService.getCart();
           setCartItems(cart);
           setLoading(false);
         } catch (err) {
           console.error("Error loading cart:", err);
           setError("Gagal memuat keranjang belanja");
           setLoading(false);
         }
       };

       if (isLoggedIn) {
         fetchCartItems();
       }
     }, [isLoggedIn]);

     const handleQuantityChange = async (itemId, quantity) => {
       try {
         if (quantity <= 0) {
           await cartService.removeCartItem(itemId);
         } else {
           await cartService.updateCartItem(itemId, { quantity });
         }

         // Refresh cart
         const { cart } = await cartService.getCart();
         setCartItems(cart);
       } catch (err) {
         console.error("Error updating cart:", err);
       }
     };

     // ...existing code with similar updates...
   }
   ```

### Fase 2: Orders & OrderItems

#### Backend (Persiapan API)

1. **Implementasi API Orders**

   - `POST /api/orders/` - Buat pesanan baru
   - `GET /api/orders/` - Daftar pesanan pengguna
   - `GET /api/orders/:id/` - Detail pesanan
   - `PUT /api/orders/:id/status/` - Update status pesanan
   - `POST /api/orders/:id/payment/` - Konfirmasi pembayaran
   - `DELETE /api/orders/:id/` - Batalkan pesanan

2. **Tambahan Model OrderItem**
   - Pastikan memiliki field yang sesuai dengan localStorage:
     ```python
     # Tambahan field di OrderItem model
     product_id = models.CharField(max_length=255)  # Menyimpan ID produk asli
     image = models.CharField(max_length=255, null=True, blank=True)  # URL gambar
     title = models.CharField(max_length=255)  # Nama produk saat pembelian
     price = models.DecimalField(max_digits=10, decimal_places=2)  # Harga saat pembelian
     size = models.CharField(max_length=2, choices=Product.SIZE_CHOICES, null=True, blank=True)
     sugar = models.CharField(max_length=20, null=True, blank=True)
     ice = models.CharField(max_length=20, null=True, blank=True)
     shots = models.PositiveIntegerField(default=0, null=True, blank=True)
     ```

#### Frontend (Implementasi API)

1. **Modifikasi Services API untuk Orders**

   ```javascript
   // File: Front-End/src/services/api.js

   // Orders API
   export const createOrder = async (token, orderData) => {
     const response = await fetch(`${API_URL}/orders/`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
       },
       body: JSON.stringify(orderData),
     });

     if (!response.ok) {
       throw new Error("Failed to create order");
     }

     return response.json();
   };

   export const getUserOrders = async (token) => {
     const response = await fetch(`${API_URL}/orders/`, {
       headers: {
         Authorization: `Bearer ${token}`,
       },
     });

     if (!response.ok) {
       throw new Error("Failed to fetch orders");
     }

     return response.json();
   };

   export const getOrderDetails = async (token, orderId) => {
     const response = await fetch(`${API_URL}/orders/${orderId}/`, {
       headers: {
         Authorization: `Bearer ${token}`,
       },
     });

     if (!response.ok) {
       throw new Error("Failed to fetch order details");
     }

     return response.json();
   };

   export const confirmOrderPayment = async (token, orderId, paymentData) => {
     const response = await fetch(`${API_URL}/orders/${orderId}/payment/`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
       },
       body: JSON.stringify(paymentData),
     });

     if (!response.ok) {
       throw new Error("Failed to confirm payment");
     }

     return response.json();
   };
   ```

2. **Implementasi Hybrid Storage untuk Orders**

   ```javascript
   // File: Front-End/src/services/orderService.js

   import * as api from "./api";

   // Hybrid storage untuk pesanan
   export const createOrder = async (orderData) => {
     try {
       const token = localStorage.getItem("access_token");
       const userId = localStorage.getItem("user_id");

       if (token) {
         // Buat pesanan di backend
         const response = await api.createOrder(token, orderData);

         // Simpan juga di localStorage untuk kompatibilitas
         saveOrderToLocalStorage(userId, response.order);

         return response;
       } else {
         // Gunakan localStorage saja jika tidak login
         return saveOrderToLocalStorage(userId, orderData);
       }
     } catch (error) {
       console.error("Error creating order:", error);
       // Fallback ke localStorage
       const userId = localStorage.getItem("user_id");
       return saveOrderToLocalStorage(userId, orderData);
     }
   };

   export const getUserOrders = async () => {
     try {
       const token = localStorage.getItem("access_token");
       const userId = localStorage.getItem("user_id");

       if (token) {
         // Ambil dari backend
         const response = await api.getUserOrders(token);

         // Update localStorage untuk kompatibilitas
         const ordersKey = userId ? `orders_${userId}` : "orders";
         localStorage.setItem(ordersKey, JSON.stringify(response.orders));

         return response.orders;
       } else {
         // Ambil dari localStorage jika tidak login
         return getOrdersFromLocalStorage(userId);
       }
     } catch (error) {
       console.error("Error fetching orders:", error);
       // Fallback ke localStorage
       const userId = localStorage.getItem("user_id");
       return getOrdersFromLocalStorage(userId);
     }
   };

   // Helper functions
   const getOrdersFromLocalStorage = (userId) => {
     const ordersKey = userId ? `orders_${userId}` : "orders";
     const orders = localStorage.getItem(ordersKey);
     return orders ? JSON.parse(orders) : [];
   };

   const saveOrderToLocalStorage = (userId, orderData) => {
     const ordersKey = userId ? `orders_${userId}` : "orders";
     const existingOrders = getOrdersFromLocalStorage(userId);

     // Generate order number if not provided
     if (!orderData.orderNumber) {
       orderData.orderNumber = `ORD${Date.now()}`;
     }

     // Add timestamps
     orderData.createdAt = new Date().toISOString();
     orderData.updatedAt = new Date().toISOString();

     // Add to orders list
     existingOrders.push(orderData);

     // Save back to localStorage
     localStorage.setItem(ordersKey, JSON.stringify(existingOrders));

     return { order: orderData };
   };
   ```

3. **Modifikasi Komponen Checkout**

   ```javascript
   // File: Front-End/src/app/Checkout/page.jsx

   import { useState } from "react";
   import { useRouter } from "next/navigation";
   import * as orderService from "@/services/orderService";
   import * as cartService from "@/services/cartService";

   export default function Checkout() {
     // ...existing code...

     const handlePayment = async () => {
       // ...existing code...

       try {
         setProcessing(true);

         // Prepare order data
         const orderData = {
           items: cartItems,
           totalAmount: calculateTotal(),
           paymentMethod: paymentMethod,
           status: "pending",
           deliveryMethod: pickupMethod,
           // Other fields as needed
         };

         // Use orderService to create the order
         const { order } = await orderService.createOrder(orderData);

         // Clear cart after successful order
         await cartService.clearCart();

         // Redirect to payment confirmation
         router.push(
           `/Checkout/PaymentConfirmation?orderNumber=${order.orderNumber}`
         );
       } catch (error) {
         console.error("Payment error:", error);
         setPaymentError("Gagal memproses pembayaran");
       } finally {
         setProcessing(false);
       }
     };

     // ...existing code...
   }
   ```

### Fase 3: Review Produk

#### Backend (Persiapan API)

1. **Implementasi API Reviews**

   - `GET /api/reviews/products/:productId/` - Ambil review untuk produk tertentu
   - `POST /api/reviews/` - Tambah review baru
   - `PUT /api/reviews/:id/` - Update review
   - `DELETE /api/reviews/:id/` - Hapus review
   - `GET /api/reviews/user/purchased-products/` - Ambil produk yang telah dibeli oleh user

2. **Pastikan model Review sudah sesuai**
   - Tambahkan field yang mungkin diperlukan:
     ```python
     # Tambahan field di Review model sesuai kebutuhan
     avatar = models.URLField(max_length=255, null=True, blank=True)  # URL avatar user
     ```

#### Frontend (Implementasi API)

1. **Modifikasi Services API untuk Reviews**

   ```javascript
   // File: Front-End/src/services/api.js

   // Reviews API
   export const getProductReviews = async (productId) => {
     try {
       // Coba ambil review dari backend
       const response = await fetch(
         `${API_URL}/reviews/products/${productId}/`
       );

       if (!response.ok) {
         throw new Error("Failed to fetch reviews");
       }

       return response.json();
     } catch (error) {
       console.error("Error fetching product reviews:", error);

       // Fallback ke localStorage
       return getReviewsFromLocalStorage(productId);
     }
   };

   export const addProductReview = async (token, reviewData) => {
     try {
       const response = await fetch(`${API_URL}/reviews/`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify(reviewData),
       });

       if (!response.ok) {
         throw new Error("Failed to add review");
       }

       const result = await response.json();

       // Simpan juga di localStorage untuk kompatibilitas
       saveReviewToLocalStorage(reviewData);

       return result;
     } catch (error) {
       console.error("Error adding product review:", error);

       // Fallback ke localStorage
       return saveReviewToLocalStorage(reviewData);
     }
   };

   export const getPurchasedProducts = async (token) => {
     try {
       const response = await fetch(
         `${API_URL}/reviews/user/purchased-products/`,
         {
           headers: {
             Authorization: `Bearer ${token}`,
           },
         }
       );

       if (!response.ok) {
         throw new Error("Failed to fetch purchased products");
       }

       return response.json();
     } catch (error) {
       console.error("Error fetching purchased products:", error);

       // Fallback ke localStorage
       const userId = localStorage.getItem("user_id");
       return getPurchasedProductsFromLocalStorage(userId);
     }
   };

   // Helper functions
   const getReviewsFromLocalStorage = (productId) => {
     const reviewsData = localStorage.getItem("product_reviews");
     let reviews = reviewsData ? JSON.parse(reviewsData) : [];

     return reviews.filter((review) => review.productId === productId);
   };

   const saveReviewToLocalStorage = (reviewData) => {
     if (!reviewData.productId || !reviewData.userId || !reviewData.rating) {
       throw new Error("Data review tidak lengkap");
     }

     // Process avatar if available
     try {
       const userData = JSON.parse(localStorage.getItem("user_data"));
       if (userData && userData.avatar) {
         reviewData.avatar = userData.avatar;
       }
     } catch (err) {
       console.error("Error adding avatar to review:", err);
     }

     // Get existing reviews
     const reviewsData = localStorage.getItem("product_reviews");
     let reviews = reviewsData ? JSON.parse(reviewsData) : [];

     // Check if user already reviewed this product
     const existingIndex = reviews.findIndex(
       (review) =>
         review.productId === reviewData.productId &&
         review.userId === reviewData.userId
     );

     const now = new Date().toISOString();

     if (existingIndex !== -1) {
       // Update existing review
       reviews[existingIndex] = {
         ...reviews[existingIndex],
         ...reviewData,
         updatedAt: now,
       };
     } else {
       // Add new review
       reviews.push({
         ...reviewData,
         id: Date.now().toString(),
         createdAt: now,
         updatedAt: now,
       });
     }

     // Save back to localStorage
     localStorage.setItem("product_reviews", JSON.stringify(reviews));

     return reviewData;
   };
   ```

2. **Modifikasi Komponen Review**

   ```javascript
   // File: Front-End/src/components/ReviewForm.jsx

   import { useState } from "react";
   import { addProductReview } from "@/services/api";

   export default function ReviewForm({
     productId,
     productName,
     onReviewSubmitted,
   }) {
     // ...existing code...

     const handleSubmit = async (e) => {
       e.preventDefault();
       setIsSubmitting(true);
       setError(null);
       setSuccess(false);

       try {
         const token = localStorage.getItem("access_token");
         const userId = localStorage.getItem("user_id");
         const user = localStorage.getItem("username") || "Pengguna";

         if (!token || !userId) {
           throw new Error("Anda harus login untuk memberikan review");
         }

         const reviewData = {
           productId,
           product: productId, // For backend compatibility
           userId,
           user,
           rating: Number(rating),
           comment,
         };

         // Use the API function which handles both backend and localStorage
         await addProductReview(token, reviewData);
         setSuccess(true);
         setComment("");
         setRating(5);

         if (onReviewSubmitted) {
           onReviewSubmitted();
         }
       } catch (err) {
         setError(err.message || "Gagal menambahkan review");
       } finally {
         setIsSubmitting(false);
       }
     };

     // ...existing code...
   }
   ```

## Strategi Migrasi Data

### 1. Migrasi Bertahap dengan Dukungan Hybrid Storage

Implementasi hybrid storage memungkinkan aplikasi untuk:

1. Mencoba menggunakan API backend terlebih dahulu
2. Fallback ke localStorage jika API tidak tersedia atau gagal
3. Menyinkronkan data di localStorage dengan backend secara berkala

### 2. Jadwal Migrasi

**Minggu 1: Migrasi Cart & CartItem**

- Implementasi API di backend
- Integrasikan API dengan frontend (hybrid storage)
- Tes dengan pengguna yang ada

**Minggu 2: Migrasi Orders**

- Implementasi API di backend
- Integrasikan API dengan frontend (hybrid storage)
- Tes dengan pengguna yang ada

**Minggu 3: Migrasi Reviews**

- Implementasi API di backend
- Integrasikan API dengan frontend (hybrid storage)
- Tes dengan pengguna yang ada

**Minggu 4: Pengujian & Optimasi**

- Tes performa dan keandalan
- Perbaiki bug dan masalah yang ditemukan
- Optimasi akses database

## Risiko dan Mitigasi

### Risiko Migrasi

1. **Kehilangan Data** - Pengguna mungkin kehilangan data cart/review selama migrasi

   - **Mitigasi**: Gunakan hybrid storage yang menyimpan data di backend dan localStorage

2. **Performa** - API mungkin lebih lambat dibanding localStorage

   - **Mitigasi**: Implementasi caching di frontend dan optimasi query di backend

3. **Offline Access** - Pengguna tidak dapat mengakses data tanpa koneksi internet

   - **Mitigasi**: Gunakan localStorage sebagai cache, Implementasi PWA untuk offline access

4. **Ketidakcocokan Data** - Format data di localStorage vs database backend
   - **Mitigasi**: Implementasi mapper untuk konversi format data

## Kesimpulan

Dengan rencana migrasi ini, frontend tetap mempertahankan flow yang sama namun data penting kini tersimpan di database backend. Pendekatan hybrid storage memastikan transisi yang mulus dan mengurangi risiko kehilangan data saat masa migrasi.
