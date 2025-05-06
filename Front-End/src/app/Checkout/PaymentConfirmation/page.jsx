"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatRupiah } from "@/utils/formatters";
import { QRCodeCanvas } from "qrcode.react";
import * as orderService from "@/services/orderService";
import Image from "next/image";
import { Button } from "@/components/ui/button";

function PaymentConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [parsedOrderData, setParsedOrderData] = useState({
    orderNumber: "",
    totalAmount: 0,
    paymentMethod: "",
    deliveryMethod: "",
    items: []
  });

  // Calculate proper subtotal from items
  const getSubtotal = (items) => {
    if (!items || !items.length) return 0;
    
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price || item.unit_price || 0);
      const quantity = parseInt(item.quantity || 1);
      return sum + (price * quantity);
    }, 0);
  };

  // Get total amount with delivery fee
  const getTotalAmount = (order) => {
    // Fixed delivery fee
    const DELIVERY_FEE = 10000;
    
    // Calculate subtotal
    const subtotal = getSubtotal(order.items);
    
    // Add delivery fee if applicable
    const isDelivery = order.delivery_method === 'delivery' || 
                       order.pickupMethod === 'Delivery';
    
    const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
    
    // Get discount amount
    const discount = parseFloat(order.discount_amount || 0);
    
    // Calculate total
    const total = subtotal + deliveryFee - discount;
    
    console.log("Total calculation:", { 
      subtotal, 
      deliveryFee, 
      discount, 
      total 
    });
    
    return total;
  };

  // Helper function to extract and normalize order data
  const parseOrderData = (orderData) => {
    console.log("Parsing order data:", orderData);
    
    // Use fixed delivery fee amount
    const DELIVERY_FEE = 10000;
    
    // Extract basic information
    const parsed = {
      orderNumber: orderData.order_number || orderData.orderNumber || "",
      totalAmount: 0,
      paymentMethod: "",
      deliveryMethod: "",
      items: orderData.items || [],
      address: ""
    };
    
    // Extract payment method
    if (orderData.payment && orderData.payment.payment_method) {
      parsed.paymentMethod = orderData.payment.payment_method;
    } else if (orderData.payment_method) {
      parsed.paymentMethod = orderData.payment_method;
    } else if (orderData.paymentMethod) {
      parsed.paymentMethod = orderData.paymentMethod;
    }
    
    // Determine if delivery
    let isDelivery = false;
    
    // Extract delivery method and address
    if (orderData.delivery_method) {
      parsed.deliveryMethod = orderData.delivery_method;
      isDelivery = parsed.deliveryMethod === "delivery";
      
      if (isDelivery) {
        if (orderData.delivery_address_text) {
          parsed.address = orderData.delivery_address_text;
        } else if (orderData.delivery_address && orderData.delivery_address.address) {
          parsed.address = orderData.delivery_address.address;
        }
      } else {
        parsed.address = orderData.pickup_location || "";
      }
    } else if (orderData.pickupMethod) {
      parsed.deliveryMethod = orderData.pickupMethod.toLowerCase().includes("pickup") ? "pickup" : "delivery";
      isDelivery = parsed.deliveryMethod === "delivery";
      parsed.address = isDelivery ? orderData.address || "" : orderData.pickupLocation || "";
    }
    
    // Set the fixed total amount
    parsed.totalAmount = getTotalAmount(orderData);
    
    console.log("Parsed order data:", parsed);
    return parsed;
  };

  // Generate random QR code data
  const generateRandomQRData = () => {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(7);
    return `ORDER-${order?.orderNumber || order?.order_number}-${timestamp}-${random}`;
  };

  // Generate QR code for e-wallet payments
  const generateQRCode = (orderNumber, amount) => {
    console.log(`Generating QR code for order ${orderNumber} with amount ${amount}`);
    try {
      // In a real app, you would call an API to get a real QR code
      // For this demo, we'll just generate a random one
      const qrData = generateRandomQRData();
      console.log("Generated QR data:", qrData);
      setQrCode(qrData);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  useEffect(() => {
    console.log("PaymentConfirmation page mounted");
    const token = localStorage.getItem("access_token");
    console.log("User authentication token:", token ? "Present" : "Not found");
    setIsLoggedIn(!!token);
    
    const orderNumber = searchParams.get("order") || searchParams.get("orderNumber");
    console.log("Order number from URL params:", orderNumber);
    
    if (!orderNumber) {
      console.log("No order number found in URL, redirecting to cart");
      router.push("/Cart");
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null); // Reset error state
      console.log("Starting to fetch order data");
      
      // Fetch order details from API or get from session storage
      let orderData;
      
      // Try to get from session storage first
      const sessionOrder = sessionStorage.getItem("order");
      console.log("Session storage order:", sessionOrder ? "Found" : "Not found");
      
      if (sessionOrder) {
        try {
          console.log("Using session storage data");
          orderData = JSON.parse(sessionOrder);
          console.log("Order parsed from session storage:", orderData);
          
          // Check if this order matches our URL param
          if (orderData.orderNumber !== orderNumber && 
              orderData.order_number !== orderNumber) {
            console.log("Order number in session doesn't match URL parameter");
          }
        } catch (e) {
          console.error("Failed to parse order from session storage:", e);
        }
      }
      
      // If user is logged in and we still need order data, try the API
      if (token && (!orderData || !orderData.items)) {
        try {
          console.log("Attempting to fetch order from API with token");
          orderData = await orderService.getOrderByNumber(token, orderNumber);
          console.log("Order fetched from API:", orderData);
        } catch (error) {
          console.log("Error fetching from API:", error);
        }
      }
      
      // If we still don't have order data, create a default one to avoid crashes
      if (!orderData || !orderData.items) {
        console.error("No valid order data found, using fallback");
        
        // Create a basic default order to avoid UI crashes
        orderData = {
          orderNumber: orderNumber,
          items: [
            {
              title: "Product 1",
              quantity: 1,
              size: "M",
              price: 25000
            }
          ],
          totalAmount: 25000,
          paymentMethod: "e_wallet",
          deliveryMethod: "pickup",
          pickupLocation: "Main Store",
          status: "pending"
        };
        
        setError("Data pesanan tidak ditemukan secara lengkap. Menggunakan data default.");
      }
      
      console.log("Setting order data to state:", orderData);
      setOrder(orderData);
      const parsedData = parseOrderData(orderData);
      setParsedOrderData(parsedData);
      console.log("Parsed order data:", parsedData);
      
      // Generate QR Code if payment method is e-wallet
      if (parsedData.paymentMethod === "e_wallet") {
        generateQRCode(parsedData.orderNumber, parsedData.totalAmount);
      }
      
      setLoading(false);
    };
    
    fetchOrder().catch(err => {
      console.error("Error in fetchOrder:", err);
      setError(err.message || "Failed to load order");
      setLoading(false);
    });
  }, [searchParams, router]);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    
    try {
      const orderNumber = parsedOrderData.orderNumber;
      console.log(`Attempting to confirm payment for order: ${orderNumber}`);
      
      // Use the new confirmPayment function from orderService
      if (isLoggedIn) {
        try {
          // Process payment via API
          await orderService.confirmPayment(orderNumber);
          
          // Redirect to success page
          router.push(`/Checkout/Success?order=${orderNumber}`);
          return;
        } catch (err) {
          console.error("Error processing payment via API:", err);
          setError("Gagal memproses pembayaran: " + (err.message || "Unknown error"));
          setIsProcessing(false);
          return;
        }
      }
      
      // Fallback for non-logged in users
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const userId = localStorage.getItem("user_id");
      const ordersKey = userId ? `orders_${userId}` : "orders";
      const savedOrders = localStorage.getItem(ordersKey);

      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        const updatedOrders = orders.map((o) => {
          if (o.orderNumber === orderNumber) {
            return { ...o, status: "completed" };
          }
          return o;
        });

        localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
        router.push(`/Checkout/Success?order=${orderNumber}`);
      }
    } catch (err) {
      console.error("Error confirming payment:", err);
      setError("Gagal mengkonfirmasi pembayaran: " + (err.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
      setIsProcessing(true);
      
      try {
        const token = localStorage.getItem("access_token");
        
        // Jika order dari database (order memiliki property 'id')
        if (isLoggedIn && order.id) {
          try {
            // Batalkan pesanan melalui API
            await orderService.cancelOrder(token, order.id);
            setIsProcessing(false);
            router.push("/profile/Orders");
            return;
          } catch (err) {
            console.error("Error cancelling order via API:", err);
            setError("Gagal membatalkan pesanan via API");
            setIsProcessing(false);
            return;
          }
        }
        
        // Fallback ke localStorage untuk user tanpa login
        const userId = localStorage.getItem("user_id");
        const ordersKey = userId ? `orders_${userId}` : "orders";
        const savedOrders = localStorage.getItem(ordersKey);

        if (savedOrders) {
          const orders = JSON.parse(savedOrders);
          const updatedOrders = orders.map((o) => {
            if (o.orderNumber === order.orderNumber) {
              return { ...o, status: "cancelled" };
            }
            return o;
          });

          localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
          router.push("/profile/Orders");
        }
      } catch (err) {
        console.error("Error cancelling order:", err);
        setError("Gagal membatalkan pesanan");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const getPaymentInstructions = (paymentMethod) => {
    console.log("Getting payment instructions for:", paymentMethod);
    
    if (!paymentMethod) {
      return <p>Tidak ada instruksi pembayaran tersedia.</p>;
    }

    switch (paymentMethod.toLowerCase()) {
      case "cash":
        return (
          <div>
            <p>Silakan lakukan pembayaran tunai saat mengambil pesanan.</p>
          </div>
        );
      case "transfer":
        return (
          <div>
            <p className="mb-2">
              Silakan transfer ke rekening berikut:
            </p>
            <ul className="list-disc pl-5 mb-2">
              <li>Bank BCA: 1234567890 (COFFEE SHOP)</li>
              <li>Bank Mandiri: 0987654321 (COFFEE SHOP)</li>
            </ul>
            <p>
              Setelah transfer, silakan klik tombol Konfirmasi Pembayaran di bawah
              ini.
            </p>
          </div>
        );
      case "e_wallet":
        return (
          <div>
            <p className="mb-2">
              Silakan scan QR code di bawah ini menggunakan e-wallet
              Anda:
            </p>
            <ul className="list-disc pl-5">
              <li>DANA</li>
              <li>GoPay</li>
              <li>OVO</li>
              <li>ShopeePay</li>
            </ul>
          </div>
        );
      default:
        return <p>Silakan ikuti instruksi pembayaran dari penjual.</p>;
    }
  };

  // Fungsi helper untuk mendapatkan data order dengan mempertimbangkan format dari API vs localStorage
  const getOrderData = (field) => {
    if (!order) return "";
    
    // Log order for debugging
    console.log(`Getting field ${field} from order:`, order);
    
    // Check if we have the raw data structure directly from API
    console.log("Order keys:", Object.keys(order));
    
    switch (field) {
      case "orderNumber":
        return order.orderNumber || order.order_number || "";
      case "totalAmount":
        // Debug all potential total amount fields
        console.log("Total amount fields:", {
          total_amount: order.total_amount,
          totalAmount: order.totalAmount,
          final_total: order.final_total,
          get_final_total: order.get_final_total
        });
        
        // Check for final_total field first (most accurate from API)
        if (order.final_total !== undefined) {
          return parseFloat(order.final_total);
        }
        // Then check for callable get_final_total if it exists
        else if (order.get_final_total !== undefined) {
          return parseFloat(order.get_final_total);
        }
        // Then try total_amount from API
        else if (order.total_amount !== undefined) {
          return parseFloat(order.total_amount);
        }
        // Fallback to localStorage totalAmount 
        else if (order.totalAmount !== undefined) {
          return parseFloat(order.totalAmount);
        }
        else {
          // Log all order fields as a last debug resort
          console.log("All order fields:", order);
          return 0;
        }
      case "paymentMethod":
        // Debug payment method fields
        console.log("Payment method fields:", {
          paymentMethod: order.paymentMethod, 
          payment_method: order.payment_method,
          payment: order?.payment?.payment_method
        });
        
        // Try all possible payment method fields
        let method = order.paymentMethod || order.payment_method;
        
        // If still not found, try to get from payment object
        if (!method && order.payment && order.payment.payment_method) {
          method = order.payment.payment_method;
        }
        
        console.log("Final payment method:", method);
        
        // Map the method to display values
        return method === "cash" 
          ? "Tunai" 
          : method === "transfer" 
            ? "Transfer Bank" 
            : method === "e_wallet"
              ? "E-Wallet"
              : method || "Tidak diketahui";
      case "pickupMethod":
        // Untuk pesanan dari API
        if (order.delivery_method) {
          if (order.delivery_method === "pickup") {
            return `Pickup (${order.pickup_location || ""})`;
          } else {
            // Try several ways to get address details
            const addressText = order.delivery_address_text 
              || (order.delivery_address && order.delivery_address.address)
              || "";
            return `Delivery (${addressText})`;
          }
        } 
        // Untuk pesanan dari localStorage
        else {
          return order.pickupMethod === "Pickup"
            ? `Pickup (${order.pickupLocation || ""})`
            : `Delivery (${order.address || ""})`;
        }
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>{error || "Pesanan tidak ditemukan"}</p>
          <button
            onClick={() => router.push("/Cart")}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Kembali ke Keranjang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Konfirmasi Pembayaran</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Detail Pesanan</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Nomor Pesanan</p>
              <p className="font-medium">{parsedOrderData.orderNumber}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Pembayaran</p>
              <p className="font-medium text-lg">
                {formatRupiah(parsedOrderData.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Metode Pembayaran</p>
              <p className="font-medium">
                {parsedOrderData.paymentMethod === "cash" ? "Tunai" :
                 parsedOrderData.paymentMethod === "transfer" ? "Transfer Bank" :
                 parsedOrderData.paymentMethod === "e_wallet" ? "E-Wallet" :
                 parsedOrderData.paymentMethod || "Tidak diketahui"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Metode Pengambilan</p>
              <p className="font-medium">
                {parsedOrderData.deliveryMethod === "pickup" 
                  ? `Pickup (${parsedOrderData.address})` 
                  : `Delivery (${parsedOrderData.address})`}
              </p>
            </div>
          </div>
        </div>
        
        {/* Display order items if available */}
        {order.items && order.items.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Item Pesanan</h2>
            <div className="space-y-3">
              {order.items.map((item, index) => {
                // Handle both API and localStorage item structures
                const productName = item.product_detail?.name || 
                                    item.product_name || 
                                    item.title || 
                                    `Product ${index + 1}`;
                                    
                // Improved price extraction logic
                let price = 0;
                
                if (item.price !== undefined && item.price !== null) {
                  price = Number(item.price);
                } else if (item.unit_price !== undefined && item.unit_price !== null) {
                  price = Number(item.unit_price);
                } else if (item.total_price !== undefined && item.total_price !== null && item.quantity) {
                  price = Number(item.total_price) / Number(item.quantity);
                } else if (item.product_detail?.price !== undefined) {
                  price = Number(item.product_detail.price);
                }
                
                console.log(`Item ${index} price details:`, {
                  name: productName,
                  price: item.price,
                  unit_price: item.unit_price,
                  total_price: item.total_price,
                  product_detail_price: item.product_detail?.price,
                  final_calculated_price: price
                });
                                    
                const quantity = Number(item.quantity || 1);
                const size = item.size || 'Regular';
                const totalPrice = price * quantity;
                
                return (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{productName}</p>
                      <p className="text-sm text-gray-600">
                        {quantity} x {formatRupiah(price)} ({size})
                      </p>
                    </div>
                    <div className="font-medium">
                      {formatRupiah(totalPrice)}
                    </div>
                  </div>
                );
              })}
              
              {/* Order summary */}
              <div className="mt-4 pt-2 border-t">
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p>{formatRupiah(order.subtotal || order.get_subtotal || parsedOrderData.totalAmount || 0)}</p>
                </div>
                
                {/* Show delivery fee if delivery method */}
                {(order.delivery_method === 'delivery' || parsedOrderData.deliveryMethod === 'delivery') && (
                  <div className="flex justify-between">
                    <p>Biaya Pengiriman</p>
                    <p>{formatRupiah(10000)}</p>
                  </div>
                )}
                
                {/* Show discount if applied */}
                {(Number(order.discount_amount) > 0 || Number(order.points_used) > 0) && (
                  <div className="flex justify-between text-green-600">
                    <p>Diskon</p>
                    <p>-{formatRupiah(order.discount_amount || 0)}</p>
                  </div>
                )}
                
                <div className="flex justify-between font-bold mt-2">
                  <p>Total</p>
                  <p>{formatRupiah(parsedOrderData.totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Instructions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Instruksi Pembayaran</h2>
          <div className="mb-4">
            {getPaymentInstructions(parsedOrderData.paymentMethod)}
          </div>

          {parsedOrderData.paymentMethod === "e_wallet" && (
            <div className="flex flex-col items-center mb-4">
              <div className="w-48 h-48 bg-gray-200 mb-2 flex items-center justify-center">
                {qrCode ? (
                  <QRCodeCanvas
                    value={qrCode}
                    size={180}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                  />
                ) : (
                  <p className="text-sm text-center text-gray-600">Generating QR code...</p>
                )}
              </div>
              <p className="text-sm text-center text-gray-600">
                Scan QR code di atas untuk melakukan pembayaran
              </p>
            </div>
          )}

          <button
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className={`w-full mb-2 bg-green-600 text-white px-4 py-2 rounded ${isProcessing ? 'opacity-70' : 'hover:bg-green-700'}`}
          >
            {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
          </button>
          
          <button
            onClick={handleCancelOrder}
            className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
          >
            Batalkan Pesanan Saya
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Memuat...</div>}>
      <PaymentConfirmationContent />
    </Suspense>
  );
}
