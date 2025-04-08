"use client";
import { useState, useEffect } from "react";
import { products } from "../Product/data";

// Format rupiah
const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);

export default function Cart() {
    const [cartItems, setCartItems] = useState([]);
    const [note, setNote] = useState("");
    const [pickupMethod, setPickupMethod] = useState("Pickup");
    const [address, setAddress] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("QRIS");

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(stored);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
    
        if (token) {
            fetch("http://localhost:8000/api/profile/", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(res => res.json())
            .then(data => {
                // Cek hanya isi kalau address-nya belum disetting user saat ini
                if (!address) {
                    setAddress(data.address || "");
                }
            })
            .catch(err => {
                console.error("Gagal mengambil data profil user:", err);
            });
        }
    }, [address]);    

    const handleQuantityChange = (id, quantity) => {
        const updated =
          quantity < 1
            ? cartItems.filter((item) => item.id !== id)
            : cartItems.map((item) =>
                item.id === id ? { ...item, quantity } : item
              );
        setCartItems(updated);
        localStorage.setItem("cart", JSON.stringify(updated));
    };
    
    const handleSizeChange = (id, size) => {
        const updated = cartItems.map((item) =>
          item.id === id ? { ...item, size } : item
        );
        setCartItems(updated);
        localStorage.setItem("cart", JSON.stringify(updated));
      };

    const getSizeExtraPrice = (size) => {
        if (size === "Medium") return 5000;
        if (size === "Large") return 10000;
        return 0;
    };

    const total = cartItems.reduce((acc, item) => {
        const basePrice = parseInt(item.price.replace(/\./g, ""));
        const sizeExtra = getSizeExtraPrice(item.size);
        return acc + (basePrice + sizeExtra) * item.quantity;
    }, 0);    

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-semibold">Keranjang Belanja</h2>
            <div className="space-y-4">
                {cartItems.length === 0 && <p>Keranjang masih kosong.</p>}
                {cartItems.map((item) => {
                    const prod = products.find((p) => p.id === item.id);
                    return (
                        <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded shadow">
                            <div className="flex items-center gap-4">
                            <img
                            src={(prod?.image || item.image).startsWith("/") ? (prod?.image || item.image) : `/${prod?.image || item.image}`}
                            alt={prod?.title || item.title}
                            className="w-16 h-16 object-cover rounded"
                            />
                                <div>
                                <h3 className="font-semibold">{item.title}</h3>
                                {/* Deskripsi customization */}
                                <p className="text-sm italic text-gray-500">
                                    Es: {item.ice || "-"}, 
                                    Gula: {item.sugar || "-"}, 
                                    Shot: {item.shots || "-"}, 
                                    Ukuran: {item.size || "-"}
                                    {getSizeExtraPrice(item.size) > 0 && (
                                        <span className="ml-1 text-red-500">
                                        (+{formatRupiah(getSizeExtraPrice(item.size))})
                                        </span>
                                    )}
                                </p>

                                <p>{formatRupiah(parseInt(item.price.replace(/\./g, "")))}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
    <button
        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#D2B48C] text-white text-lg"
    >
        -
    </button>
    <span className="text-base">{item.quantity}</span>
    <button
        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#D2B48C] text-white text-lg"
    >
        +
    </button>
</div>

                        </div>
                    );
                })}
            </div>

            {/* Pickup Method */}
            <div>
                <p className="font-medium mb-2">Metode Pengambilan:</p>
                <div className="flex gap-4">
                    <div
                        onClick={() => setPickupMethod("Pickup")}
                        className={`cursor-pointer border p-3 rounded-lg w-40 text-center ${pickupMethod === "Pickup" ? "border-green-500" : ""}`}
                    >
                        <img src="../pickup.png" alt="Pickup" className="w-8 mx-auto mb-1" />
                        <p className="font-semibold">Pickup</p>
                        <p className="text-xs text-gray-500">Ambil di store</p>
                    </div>
                    <div
                        onClick={() => setPickupMethod("Delivery")}
                        className={`cursor-pointer border p-3 rounded-lg w-40 text-center ${pickupMethod === "Delivery" ? "border-green-500" : ""}`}
                    >
                        <img src="../truck_2954822.png" alt="Delivery" className="w-8 mx-auto mb-1" />
                        <p className="font-semibold">Delivery</p>
                        <p className="text-xs text-gray-500">Diantar ke alamat</p>
                    </div>
                </div>
            </div>

            {/* Address */}
            {pickupMethod === "Delivery" && (
                <div>
                    <label className="block font-medium mb-1">Alamat Pengantaran:</label>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        maxLength={300}
                        placeholder="Contoh: Jl. Lowokwaru No.12, Kota Malang, Jawa Timur"
                        className="border rounded w-full p-2 resize-none overflow-hidden"
                        rows={1}
                        onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                    />
                </div>
            )}

            {/* Notes */}
            <div>
                <label className="block font-medium mb-1">Catatan untuk Penjual:</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    placeholder="Contoh: tanpa gula, extra ice, dll"
                    className="border rounded w-full p-2 resize-none overflow-hidden"
                    rows={1}
                    onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                />
            </div>

            {/* Payment Method */}
            <div>
                <p className="font-medium mb-2">Metode Pembayaran:</p>
                <div className="flex gap-4">
                    <div
                        onClick={() => setPaymentMethod("QRIS")}
                        className={`cursor-pointer border p-3 rounded-lg w-28 text-center ${paymentMethod === "QRIS" ? "border-green-500" : ""}`}
                    >
                        <img src="../quick-response-code-indonesia-standard-qris-logo-png_seeklogo-391791.png" alt="QRIS" className="w-8 mx-auto mb-1" />
                        <p className="text-sm">QRIS</p>
                    </div>
                    <div
                        onClick={() => setPaymentMethod("Transfer Bank")}
                        className={`cursor-pointer border p-3 rounded-lg w-28 text-center ${paymentMethod === "Transfer Bank" ? "border-green-500" : ""}`}
                    >
                        <img src="../bank.png" alt="Bank Transfer" className="w-8 mx-auto mb-1" />
                        <p className="text-sm">Transfer Bank</p>
                    </div>
                    <div
                        onClick={() => setPaymentMethod("Tunai")}
                        className={`cursor-pointer border p-3 rounded-lg w-28 text-center ${paymentMethod === "Tunai" ? "border-green-500" : ""}`}
                    >
                        <img src="../cash.png" alt="Cash" className="w-8 mx-auto mb-1" />
                        <p className="text-sm">Tunai</p>
                    </div>
                </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total: {formatRupiah(total)}</span>
                <button className="px-6 py-2 bg-green-600 text-white rounded">Checkout</button>
            </div>
        </div>
    );
}
