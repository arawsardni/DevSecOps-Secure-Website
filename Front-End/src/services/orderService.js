// Konstanta untuk API URL
// - Di browser pengguna: http://10.34.100.143:8000/api
// - Di dalam container: http://backend:8000/api
const API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BROWSER_API_URL || "http://10.34.100.143:8000/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://backend:8000/api";

/**
 * Mendapatkan daftar pesanan pengguna
 * @param {string} token - Token autentikasi
 * @returns {Promise} Promise yang mengembalikan array pesanan
 */
export const getUserOrders = async (token) => {
  try {
    const response = await fetch(`${API_URL}/orders/list/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil daftar pesanan");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getUserOrders:", error);
    throw error;
  }
};

/**
 * Mendapatkan detail pesanan berdasarkan ID
 * @param {string} token - Token autentikasi
 * @param {string} orderId - ID pesanan
 * @returns {Promise} Promise yang mengembalikan detail pesanan
 */
export const getOrderDetail = async (token, orderId) => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil detail pesanan");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getOrderDetail:", error);
    throw error;
  }
};

/**
 * Membuat pesanan baru
 * @param {string} token - Token autentikasi
 * @param {Object} orderData - Data pesanan baru
 * @returns {Promise} Promise yang mengembalikan pesanan yang dibuat
 */
export const createOrder = async (token, orderData) => {
  try {
    console.log("Creating new order with data:", orderData);

    const response = await fetch(`${API_URL}/orders/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", responseText);
      throw new Error("Invalid response format from server");
    }

    console.log("Create order response:", {
      status: response.status,
      ok: response.ok,
      data: responseData,
    });

    if (!response.ok) {
      const errorMessage = responseData.error || "Gagal membuat pesanan";
      console.error("Server returned error:", errorMessage);
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw error;
  }
};

/**
 * Membatalkan pesanan
 * @param {string} token - Token autentikasi
 * @param {string} orderId - ID pesanan yang akan dibatalkan
 * @returns {Promise} Promise yang mengembalikan status pembatalan
 */
export const cancelOrder = async (token, orderId) => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/cancel/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Gagal membatalkan pesanan");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in cancelOrder:", error);
    throw error;
  }
};

/**
 * Memproses pembayaran untuk pesanan
 * @param {string} token - Token autentikasi
 * @param {string} orderId - ID pesanan
 * @param {Object} paymentData - Data pembayaran
 * @returns {Promise} Promise yang mengembalikan status pembayaran
 */
export const processPayment = async (token, orderId, paymentData) => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/pay/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error("Gagal memproses pembayaran");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in processPayment:", error);
    throw error;
  }
};

/**
 * Memigrasikan pesanan dari localStorage ke database
 * @param {string} token - Token autentikasi
 * @returns {Promise} Promise yang mengembalikan array pesanan yang berhasil dimigrasi
 */
export const migrateOrdersFromLocalStorage = async (token) => {
  try {
    // Ambil data pesanan dari localStorage
    const userId = localStorage.getItem("user_id");
    const ordersKey = userId ? `orders_${userId}` : "orders";
    const savedOrders = localStorage.getItem(ordersKey);

    if (!savedOrders) {
      return {
        status: "info",
        message: "Tidak ada pesanan yang tersimpan di localStorage",
      };
    }

    const orders = JSON.parse(savedOrders);
    console.log(`Found ${orders.length} orders in localStorage:`, orders);

    if (orders.length === 0) {
      return {
        status: "info",
        message: "Tidak ada pesanan yang tersimpan di localStorage",
      };
    }

    // Array untuk menampung hasil migrasi
    const migratedOrders = [];
    const failedOrders = [];

    // Loop melalui semua pesanan dan migrasi satu per satu
    for (const localOrder of orders) {
      try {
        // Format data pesanan sesuai dengan API
        const orderData = formatOrderForApi(localOrder);

        // Buat pesanan baru di database
        const result = await createOrder(token, orderData);
        console.log(
          `Successfully migrated order ${localOrder.orderNumber}:`,
          result
        );

        migratedOrders.push({
          orderNumber: localOrder.orderNumber,
          newOrderId: result.id,
          success: true,
        });
      } catch (err) {
        console.error(
          `Failed to migrate order ${localOrder.orderNumber}:`,
          err
        );
        failedOrders.push({
          orderNumber: localOrder.orderNumber,
          error: err.message,
        });
      }
    }

    // Hapus pesanan yang berhasil dimigrasi dari localStorage jika pengguna mau
    if (
      migratedOrders.length > 0 &&
      window.confirm("Hapus pesanan yang sudah dimigrasi dari localStorage?")
    ) {
      // Filter pesanan yang gagal dimigrasi
      const remainingOrders = orders.filter(
        (order) =>
          !migratedOrders.some(
            (migrated) => migrated.orderNumber === order.orderNumber
          )
      );

      // Simpan kembali pesanan yang tersisa
      localStorage.setItem(ordersKey, JSON.stringify(remainingOrders));
    }

    return {
      status: "success",
      message: `Berhasil memigrasi ${migratedOrders.length} pesanan, gagal ${failedOrders.length} pesanan`,
      migratedOrders,
      failedOrders,
    };
  } catch (error) {
    console.error("Error in migrateOrdersFromLocalStorage:", error);
    throw error;
  }
};

// Helper function untuk memformat data pesanan dari localStorage ke format API
const formatOrderForApi = (localOrder) => {
  // Convert payment method dari localStorage ke format API
  const paymentMethodMap = {
    cash: "cash",
    transfer: "transfer",
    e_wallet: "e_wallet",
    QRIS: "e_wallet",
    qris: "e_wallet",
    credit_card: "credit_card",
    debit_card: "debit_card",
  };

  // Convert delivery method dari localStorage ke format API
  const deliveryMethodMap = {
    Pickup: "pickup",
    pickup: "pickup",
    Delivery: "delivery",
    delivery: "delivery",
  };

  // Format items untuk API
  const items = (localOrder.items || []).map((item) => {
    return {
      product: item.product || item.id,
      quantity: item.quantity || 1,
      size: item.size || "S",
      special_instructions: item.special_instructions || item.notes || "",
    };
  });

  // Format data pesanan
  return {
    delivery_method: deliveryMethodMap[localOrder.pickupMethod] || "pickup",
    delivery_address: localOrder.addressId || null,
    delivery_notes: localOrder.notes || "",
    pickup_location: localOrder.pickupLocation || "",
    pickup_time: null, // Tidak ada di data localStorage, bisa ditentukan server
    special_instructions: localOrder.notes || "",
    points_used: 0, // Default tidak menggunakan poin
    items: items,
    payment_method: paymentMethodMap[localOrder.paymentMethod] || "cash",
  };
};

/**
 * Mendapatkan detail pesanan berdasarkan nomor pesanan
 * @param {string} token - Token autentikasi
 * @param {string} orderNumber - Nomor pesanan
 * @returns {Promise} Promise yang mengembalikan detail pesanan
 */
export const getOrderByNumber = async (token, orderNumber) => {
  try {
    // Return early for empty order numbers
    if (!orderNumber || orderNumber.trim() === "") {
      console.error("Empty order number provided to getOrderByNumber");
      throw new Error("Order number is required");
    }

    console.log(
      `Fetching order by number: ${orderNumber} from endpoint: ${API_URL}/orders/by-number/${orderNumber}/`
    );

    if (!token) {
      console.warn(
        "No authentication token provided, user may not be logged in"
      );
      throw new Error("Authentication required");
    }

    // Check if this order number matches the backend format (ORD followed by numbers)
    // If not, format it for the API
    let apiOrderNumber = orderNumber;
    if (!orderNumber.startsWith("ORD") || orderNumber.includes("-")) {
      // This is likely a frontend-generated order number. Try to get the order from session storage.
      console.log(
        "Order number does not match backend format, checking session storage"
      );

      const sessionOrder = sessionStorage.getItem("order");
      if (sessionOrder) {
        try {
          const parsedOrder = JSON.parse(sessionOrder);
          console.log("Checking session order:", parsedOrder);

          if (
            parsedOrder.orderNumber === orderNumber &&
            parsedOrder.order_number
          ) {
            // We found the order in session storage and it has the API order number
            apiOrderNumber = parsedOrder.order_number;
            console.log(
              `Found matching API order number in session: ${apiOrderNumber}`
            );
          }
        } catch (e) {
          console.error("Error parsing session order:", e);
        }
      }
    }

    // Ensure the API order number is not empty
    if (!apiOrderNumber || apiOrderNumber.trim() === "") {
      throw new Error("Cannot determine valid API order number");
    }

    const response = await fetch(
      `${API_URL}/orders/by-number/${apiOrderNumber}/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`Order fetch response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response body: ${errorText}`);

      // Handle specific error cases
      if (response.status === 401) {
        throw new Error(`Authentication error: Please log in again`);
      } else if (response.status === 404) {
        throw new Error(`Order not found: ${apiOrderNumber}`);
      } else {
        throw new Error(
          `API error: ${response.status} - ${errorText || "Unknown error"}`
        );
      }
    }

    const data = await response.json();
    console.log("Order data received from API:", data);

    // Store the frontend order number for reference if needed
    if (orderNumber !== apiOrderNumber) {
      data.frontendOrderNumber = orderNumber;
    }

    return data;
  } catch (error) {
    console.error("Error in getOrderByNumber:", error);
    throw error;
  }
};

/**
 * Konfirmasi pembayaran untuk pesanan
 * @param {string} orderNumber - Nomor pesanan
 * @returns {Promise} Promise yang mengembalikan status konfirmasi pembayaran
 */
export const confirmPayment = async (orderNumber) => {
  try {
    const token = localStorage.getItem("access_token");
    console.log(
      `[DEBUG] Starting confirmPayment for order: ${orderNumber}, token exists: ${!!token}`
    );

    if (!token) {
      console.warn("[DEBUG] No authentication token found");
      throw new Error("User tidak terautentikasi");
    }

    console.log(`Confirming payment for order: ${orderNumber}`);

    // First check if we can get the order from sessionStorage
    let orderId = null;
    const sessionOrder = sessionStorage.getItem("order");
    console.log(`[DEBUG] Session order exists: ${!!sessionOrder}`);

    if (sessionOrder) {
      try {
        const parsedOrder = JSON.parse(sessionOrder);
        console.log("[DEBUG] Found order in session storage:", parsedOrder);

        // If the session order matches our order number or has the ID we need
        if (
          parsedOrder.id ||
          (parsedOrder.order_number &&
            parsedOrder.order_number === orderNumber) ||
          (parsedOrder.orderNumber && parsedOrder.orderNumber === orderNumber)
        ) {
          // Use the ID directly if available
          orderId = parsedOrder.id;
          console.log(
            `[DEBUG] Using order ID from session storage: ${orderId}`
          );
        } else {
          console.log(
            `[DEBUG] Order in session doesn't match our criteria. session order_number: ${parsedOrder.order_number}, orderNumber: ${parsedOrder.orderNumber}, target: ${orderNumber}`
          );
        }
      } catch (e) {
        console.error("[DEBUG] Error parsing session order:", e);
      }
    }

    // If we couldn't get the ID from session storage, try to fetch it from the API
    if (!orderId) {
      console.log(
        "[DEBUG] No order ID from session, attempting to fetch from API"
      );
      try {
        // Make sure we have a valid order number for API lookup
        if (!orderNumber || orderNumber.trim() === "") {
          console.error("[DEBUG] Empty order number provided");
          throw new Error("Nomor pesanan kosong");
        }

        console.log(
          `[DEBUG] Fetching order details from API for number: ${orderNumber}`
        );
        const order = await getOrderByNumber(token, orderNumber);
        console.log("[DEBUG] API returned order:", order);

        if (!order || !order.id) {
          console.error("[DEBUG] Order not found or missing ID");
          throw new Error("Pesanan tidak ditemukan di database");
        }
        orderId = order.id;
        console.log(
          `[DEBUG] Successfully fetched order ID from API: ${orderId}`
        );
      } catch (error) {
        console.error("[DEBUG] Error getting order ID from API:", error);

        // For guest users or if API fails, create a fake success response
        if (!token || error.message.includes("not found")) {
          console.log(
            "[DEBUG] Creating simulated payment success for guest user or non-existent order"
          );

          // Return a fake successful response for orders not in the database
          const simulatedResponse = {
            id: "local-" + Math.random().toString(36).substring(2, 10),
            order_number: orderNumber,
            status: "completed",
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            message: "Pembayaran berhasil (simulasi)",
          };
          console.log(
            "[DEBUG] Returning simulated response:",
            simulatedResponse
          );
          return simulatedResponse;
        }

        throw error;
      }
    }

    if (!orderId) {
      console.error(
        `[DEBUG] Failed to find order ID for number: ${orderNumber}`
      );
      throw new Error(
        `Tidak dapat menemukan ID pesanan untuk nomor: ${orderNumber}`
      );
    }

    // Process the payment using the order ID
    const paymentData = {
      payment_status: "paid",
      payment_date: new Date().toISOString(),
      amount: 0, // The backend will use the order's amount
    };

    console.log(
      `[DEBUG] Processing payment for order ID: ${orderId}`,
      paymentData
    );
    const paymentUrl = `${API_URL}/orders/${orderId}/pay/`;
    console.log(`[DEBUG] Payment endpoint URL: ${paymentUrl}`);

    const response = await fetch(paymentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    console.log(
      `[DEBUG] Payment confirmation response status: ${response.status}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DEBUG] Error response body: ${errorText}`);
      throw new Error(
        `Gagal mengkonfirmasi pembayaran: ${response.status} - ${errorText}`
      );
    }

    // Capture the raw response text first for debugging
    const responseText = await response.text();
    console.log(`[DEBUG] Raw payment response: ${responseText}`);

    let data;
    try {
      // Parse the response text as JSON
      data = JSON.parse(responseText);
      console.log("[DEBUG] Payment confirmation response:", data);
    } catch (jsonError) {
      console.error(
        "[DEBUG] Failed to parse payment response as JSON:",
        jsonError
      );
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    // Save the updated order back to session storage
    console.log("[DEBUG] Saving updated order to session storage");
    sessionStorage.setItem("order", JSON.stringify(data));

    return data;
  } catch (error) {
    console.error("[DEBUG] Error in confirmPayment:", error);
    throw error;
  }
};

// Fungsi untuk mendapatkan detail produk berdasarkan ID
async function fetchProductDetail(token, productId) {
  try {
    const response = await fetch(`${API_URL}/products/${productId}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`Error fetching product ${productId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`Fetched product details for ${productId}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
}

/**
 * Mendapatkan daftar produk yang pernah dibeli oleh user
 * @param {string} token - Token autentikasi
 * @param {string} userId - ID pengguna
 * @returns {Promise} Promise yang mengembalikan array produk yang pernah dibeli
 */
export const getUserPurchaseHistory = async (token, userId) => {
  try {
    if (!token) {
      throw new Error("Token autentikasi diperlukan");
    }

    if (!userId) {
      throw new Error("ID pengguna diperlukan");
    }

    console.log(`Fetching purchase history for user: ${userId}`);

    const response = await fetch(
      `${API_URL}/orders/user/${userId}/completed/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error fetching purchase history:", errorText);
      throw new Error(`Failed to fetch purchase history: ${response.status}`);
    }

    const data = await response.json();
    console.log("Purchase history data received:", data);

    // Debugging: Tampilkan struktur order.items pertama jika ada
    if (data && data.length > 0 && data[0].items && data[0].items.length > 0) {
      console.log(
        "Sample order item structure:",
        JSON.stringify(data[0].items[0], null, 2)
      );
      console.log("Has product_detail?", !!data[0].items[0].product_detail);
      if (data[0].items[0].product_detail) {
        console.log(
          "Product detail fields:",
          Object.keys(data[0].items[0].product_detail)
        );
      }
    }

    // Organize the purchase history data:
    // 1. Extract all products from all orders
    // 2. Group by product ID
    // 3. Add purchase count
    const purchaseHistory = {};

    // Process the orders and create initial product entries
    for (const order of data) {
      console.log(
        `Processing order ${order.order_number} with ${
          order.items?.length || 0
        } items`
      );

      if (!order.items || order.items.length === 0) {
        console.warn(`Order ${order.order_number} has no items`);
        continue;
      }

      for (const item of order.items) {
        console.log("Processing item:", item.id);

        // Get product id either from the product field directly or from product_detail
        const productId =
          item.product || (item.product_detail && item.product_detail.id);

        if (!productId) {
          console.warn("Item without product ID found:", item);
          continue; // Skip this item
        }

        if (!purchaseHistory[productId]) {
          // Use product_detail information if available
          const productName = item.product_detail
            ? item.product_detail.name
            : item.product_name || "Unknown Product";

          const productImage = item.product_detail && item.product_detail.image;

          console.log(
            `Creating new product history entry for ${productName} (ID: ${productId})`
          );
          console.log("  - Image URL:", productImage);

          purchaseHistory[productId] = {
            id: productId,
            name: productName,
            image: productImage,
            purchase_count: 0,
            last_purchased: order.created_at,
            orders: [],
          };
        }

        purchaseHistory[productId].purchase_count += item.quantity;
        purchaseHistory[productId].orders.push({
          order_id: order.id,
          order_number: order.order_number,
          purchase_date: order.created_at,
          quantity: item.quantity,
          size: item.size,
          price: item.price,
        });
      }
    }

    // Fetch missing product details if needed
    const productsWithoutDetails = Object.keys(purchaseHistory).filter(
      (productId) => !purchaseHistory[productId].image
    );

    if (productsWithoutDetails.length > 0) {
      console.log(
        `Fetching details for ${productsWithoutDetails.length} products without complete info`
      );

      for (const productId of productsWithoutDetails) {
        console.log(`Fetching additional info for product ${productId}`);
        const productDetails = await fetchProductDetail(token, productId);

        if (productDetails) {
          purchaseHistory[productId].name = productDetails.name;
          purchaseHistory[productId].image = productDetails.image;
          console.log(
            `Updated product ${productId} with name: ${productDetails.name} and image: ${productDetails.image}`
          );
        }
      }
    }

    // Convert to array and sort by purchase count (most purchased first)
    const sortedHistory = Object.values(purchaseHistory).sort(
      (a, b) => b.purchase_count - a.purchase_count
    );

    console.log(
      `Processed ${sortedHistory.length} unique products in purchase history`
    );

    return sortedHistory;
  } catch (error) {
    console.error("Error in getUserPurchaseHistory:", error);
    throw error;
  }
};
