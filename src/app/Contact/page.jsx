// app/contact/page.jsx
"use client";

import { useState } from "react";

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    return (
        <div className="bg-[#F5F1EB] py-10">
            {/* Section Title */}
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[#5A2E0D]">Hubungi Kami</h2>
                <p className="text-gray-600 mt-2">Ada pertanyaan atau komentar? Cukup tulis pesan kepada kami!</p>
            </div>

            {/* Content */}
            <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto p-6">
                {/* Info Card */}
                <div className="bg-[#8B4513] text-white p-8 rounded-2xl flex-1 space-y-4">
                    <h3 className="text-2xl font-bold mb-4">Informasi Kontak</h3>
                    <p>Jika Anda mempunyai pertanyaan atau kekhawatiran, Anda dapat menghubungi kami melalui kontak berikut:</p>
                    <div className="space-y-2 text-sm">
                        <div>📞 0812-8888-6985</div>
                        <div>📧 hello@forcoffi.coffee</div>
                        <div>📍 Gedung Graha Ganesha, Lantai 1 Suite 120 & 130<br/>Jl. Hayam Wuruk No.28, Jakarta Pusat</div>
                    </div>
                </div>

                {/* Form */}
                <div className="flex-1 space-y-4 bg-white p-6 rounded-2xl shadow-sm">
                    <div>
                        <label className="block font-medium mb-1">Name</label>
                        <input name="name" value={form.name} onChange={handleChange} className="border w-full rounded p-2" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Email</label>
                        <input name="email" value={form.email} onChange={handleChange} className="border w-full rounded p-2" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Phone Number</label>
                        <input name="phone" value={form.phone} onChange={handleChange} className="border w-full rounded p-2" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Message</label>
                        <textarea name="message" rows={4} value={form.message} onChange={handleChange} className="border w-full rounded p-2 resize-none" />
                    </div>
                    {/* Simulasi Captcha */}
                    <div className="border rounded p-3 text-xs text-gray-500">[ reCAPTCHA Dummy ]</div>
                    <button className="w-full py-2 bg-[#8B4513] text-white rounded-full">SEND</button>
                </div>
            </div>
        </div>
    );
}
