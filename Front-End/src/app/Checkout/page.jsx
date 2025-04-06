"use client";
import { useEffect, useState } from "react";
import { products } from "../Product/data";

const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);

export default function Checkout() {
    const [selectedItem, setSelectedItem] = useState(null);
    const [size, setSize] = useState("M");
    const [notes, setNotes] = useState("");
    const [pickupMethod, setPickupMethod] = useState("Pickup");
    const [paymentMethod, setPaymentMethod] = useState("QRIS");
    const [address, setAddress] = useState("");

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("checkout")) || { id: 1, quantity: 1 };
        const product = products.find((p) => p.id === stored.id);
        setSelectedItem({ ...product, quantity: stored.quantity || 1 });
    }, []);

    if (!selectedItem) return <p>Loading...</p>;

    const handleQuantityChange = (value) => {
        setSelectedItem((prev) => ({
            ...prev,
            quantity: Math.max(1, prev.quantity + value),
        }));
    };

    const handleCheckout = () => {
        if (pickupMethod === "Delivery" && address.trim() === "") {
            alert("Mohon isi alamat pengantaran.");
            return;
        }
        alert("Checkout berhasil!");
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-semibold">Checkout</h2>

            {/* Product Card */}
            <div className="flex gap-6 bg-white p-4 rounded-xl shadow">
                <img src={selectedItem.image} alt={selectedItem.title} className="w-40 h-40 object-cover rounded-lg" />
                <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold">{selectedItem.title}</h3>
                    <p>Harga: {formatRupiah(parseInt(selectedItem.price.replace(/\./g, "")))} x {selectedItem.quantity}</p>

                    {/* Size */}
                    <div>
                        <label className="block text-sm font-medium">Pilih Ukuran Gelas:</label>
                        <select value={size} onChange={(e) => setSize(e.target.value)} className="border rounded px-2 py-1">
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                        </select>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 pt-2">
                        <button onClick={() => handleQuantityChange(-1)}>-</button>
                        <span>{selectedItem.quantity}</span>
                        <button onClick={() => handleQuantityChange(1)}>+</button>
                    </div>
                </div>
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

            {/* Address Input */}
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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

            {/* Total & Checkout */}
            <div className="flex justify-between items-center pt-4 text-lg font-semibold">
                <span>Total: {formatRupiah(parseInt(selectedItem.price.replace(/\./g, "")) * selectedItem.quantity)}</span>
                <button onClick={handleCheckout} className="px-6 py-2 bg-green-600 text-white rounded">
                    Konfirmasi Pembayaran
                </button>
            </div>
        </div>
    );
}
