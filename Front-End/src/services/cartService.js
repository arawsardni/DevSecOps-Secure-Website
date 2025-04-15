// Hybrid storage untuk keranjang - menggunakan API backend dengan fallback ke localStorage
import * as api from "./api";

// Konstanta untuk API URL
// - Di browser pengguna: http://localhost:8000/api
// - Di dalam container: http://backend:8000/api
const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_BROWSER_API_URL || "http://localhost:8000/api") 
  : (process.env.NEXT_PUBLIC_API_URL || "http://backend:8000/api");

/**
 * Mendapatkan keranjang belanja dari backend atau localStorage
 */
export const getCart = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");

    // Coba ambil dari backend jika user sudah login
    if (token) {
      try {
        const response = await fetch(`${API_URL}/cart/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch cart");
        }

        const cartData = await response.json();

        // Simpan sebagai cache di localStorage
        updateLocalCart(userId, cartData.items);

        return { cart: cartData.items, total: cartData.total };
      } catch (error) {
        console.error("Error fetching cart from API:", error);
        // Fallback ke localStorage
        return {
          cart: getLocalCart(userId),
          total: calculateLocalCartTotal(getLocalCart(userId)),
        };
      }
    } else {
      // Gunakan localStorage untuk guest user
      return {
        cart: getLocalCart(userId),
        total: calculateLocalCartTotal(getLocalCart(userId)),
      };
    }
  } catch (error) {
    console.error("Error in getCart:", error);
    return { cart: [], total: 0 };
  }
};

/**
 * Menambahkan item ke keranjang
 */
export const addCartItem = async (productData) => {
  try {
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");

    if (token) {
      // Coba simpan ke backend jika user sudah login
      try {
        const response = await fetch(`${API_URL}/cart/add/`, {
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

        const cartData = await response.json();

        // Update cache di localStorage
        updateLocalCart(userId, cartData.items);

        return { cart: cartData.items, total: cartData.total };
      } catch (error) {
        console.error("Error adding item to cart via API:", error);
        // Fallback ke localStorage
        return addToLocalCart(userId, productData);
      }
    } else {
      // Gunakan localStorage untuk guest user
      return addToLocalCart(userId, productData);
    }
  } catch (error) {
    console.error("Error in addCartItem:", error);
    throw error;
  }
};

/**
 * Update item di keranjang
 */
export const updateCartItem = async (itemId, updateData) => {
  try {
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");

    if (token) {
      // Coba update via API jika user sudah login
      try {
        const response = await fetch(`${API_URL}/cart/update/${itemId}/`, {
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

        const cartData = await response.json();

        // Update cache di localStorage
        updateLocalCart(userId, cartData.items);

        return { cart: cartData.items, total: cartData.total };
      } catch (error) {
        console.error("Error updating cart item via API:", error);
        // Fallback ke localStorage
        return updateLocalCartItem(userId, itemId, updateData);
      }
    } else {
      // Gunakan localStorage untuk guest user
      return updateLocalCartItem(userId, itemId, updateData);
    }
  } catch (error) {
    console.error("Error in updateCartItem:", error);
    throw error;
  }
};

/**
 * Menghapus item dari keranjang
 */
export const removeCartItem = async (itemId) => {
  try {
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");

    if (token) {
      // Coba hapus via API jika user sudah login
      try {
        const response = await fetch(`${API_URL}/cart/remove/${itemId}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to remove cart item");
        }

        const cartData = await response.json();

        // Update cache di localStorage
        updateLocalCart(userId, cartData.items);

        return { cart: cartData.items, total: cartData.total };
      } catch (error) {
        console.error("Error removing cart item via API:", error);
        // Fallback ke localStorage
        return removeFromLocalCart(userId, itemId);
      }
    } else {
      // Gunakan localStorage untuk guest user
      return removeFromLocalCart(userId, itemId);
    }
  } catch (error) {
    console.error("Error in removeCartItem:", error);
    throw error;
  }
};

/**
 * Mengosongkan keranjang
 */
export const clearCart = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");

    if (token) {
      // Coba clear via API jika user sudah login
      try {
        const response = await fetch(`${API_URL}/cart/clear/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to clear cart");
        }

        // Update cache di localStorage
        clearLocalCart(userId);

        return { cart: [], total: 0 };
      } catch (error) {
        console.error("Error clearing cart via API:", error);
        // Fallback ke localStorage
        return clearLocalCart(userId);
      }
    } else {
      // Gunakan localStorage untuk guest user
      return clearLocalCart(userId);
    }
  } catch (error) {
    console.error("Error in clearCart:", error);
    throw error;
  }
};

// ------------------- Helper functions for localStorage -------------------

/**
 * Mendapatkan keranjang dari localStorage
 */
const getLocalCart = (userId) => {
  const cartKey = userId ? `cart_${userId}` : "cart";
  const cartData = localStorage.getItem(cartKey);
  return cartData ? JSON.parse(cartData) : [];
};

/**
 * Menyimpan keranjang ke localStorage
 */
const updateLocalCart = (userId, cartItems) => {
  const cartKey = userId ? `cart_${userId}` : "cart";
  localStorage.setItem(cartKey, JSON.stringify(cartItems));
};

/**
 * Menghitung total harga keranjang lokal
 */
const calculateLocalCartTotal = (cartItems) => {
  return cartItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

/**
 * Menambahkan item ke keranjang lokal
 */
const addToLocalCart = (userId, productData) => {
  const cart = getLocalCart(userId);

  // Cek apakah produk sudah ada di keranjang dengan spesifikasi yang sama
  const existingItemIndex = cart.findIndex(
    (item) =>
      item.product === productData.product_id &&
      item.size === productData.size &&
      item.sugar === productData.sugar &&
      item.ice === productData.ice &&
      item.shots === productData.shots
  );

  if (existingItemIndex !== -1) {
    // Update kuantitas jika produk sudah ada
    cart[existingItemIndex].quantity += productData.quantity;

    // Update special instructions jika disediakan
    if (productData.special_instructions) {
      cart[existingItemIndex].special_instructions =
        productData.special_instructions;
    }
  } else {
    // Tambahkan produk baru
    cart.push({
      id: Date.now().toString(), // ID sementara
      product: productData.product_id,
      quantity: productData.quantity,
      size: productData.size,
      sugar: productData.sugar || "normal",
      ice: productData.ice || "normal",
      shots: productData.shots || 0,
      special_instructions: productData.special_instructions || "",
      price: productData.price,
      product_detail: productData.product_detail,
    });
  }

  // Simpan keranjang yang diperbarui
  updateLocalCart(userId, cart);

  return { cart, total: calculateLocalCartTotal(cart) };
};

/**
 * Update item di keranjang lokal
 */
const updateLocalCartItem = (userId, itemId, updateData) => {
  const cart = getLocalCart(userId);
  const itemIndex = cart.findIndex((item) => item.id === itemId);

  if (itemIndex !== -1) {
    // Update item dengan data baru
    cart[itemIndex] = {
      ...cart[itemIndex],
      ...updateData,
    };

    // Simpan keranjang yang diperbarui
    updateLocalCart(userId, cart);
  }

  return { cart, total: calculateLocalCartTotal(cart) };
};

/**
 * Menghapus item dari keranjang lokal
 */
const removeFromLocalCart = (userId, itemId) => {
  const cart = getLocalCart(userId);
  const updatedCart = cart.filter((item) => item.id !== itemId);

  // Simpan keranjang yang diperbarui
  updateLocalCart(userId, updatedCart);

  return { cart: updatedCart, total: calculateLocalCartTotal(updatedCart) };
};

/**
 * Mengosongkan keranjang lokal
 */
const clearLocalCart = (userId) => {
  const cartKey = userId ? `cart_${userId}` : "cart";
  localStorage.removeItem(cartKey);

  return { cart: [], total: 0 };
};
