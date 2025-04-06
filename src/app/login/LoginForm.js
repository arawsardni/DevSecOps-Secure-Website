//loginform.js

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const dummyUser = {
  email: "user@forcoffi.com",
  password: "123456",
  name: "Wahyu Tri",
  phone_number: "08123456789",
  avatar: "/avatar.png",
  address: "Jl. Kopi No. 10, Jakarta",
  preferred_pickup_location: "Forcoffi Cikini",
  points: 1200,
  total_spent: 980000,
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("user")) {
      router.push("/");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("Email dan password harus diisi");
      setLoading(false);
      return;
    }

    if (email === dummyUser.email && password === dummyUser.password) {
      localStorage.setItem("user", JSON.stringify(dummyUser));
      window.location.reload();
      router.push("/");
    } else {
      setError("Email atau password salah");
    }
    setLoading(false);
  };

  return (
    <div className="px-6 py-8 bg-white rounded-lg shadow sm:px-10">
      <form className="mb-0 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 mb-4 border-l-4 border-red-500 bg-red-50">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brown-500 focus:border-brown-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="w-4 h-4 border-gray-300 rounded text-brown-600 focus:ring-brown-500"
            />
            <label
              htmlFor="remember-me"
              className="block ml-2 text-sm text-gray-700"
            >
              Ingat saya
            </label>
          </div>

          <div className="text-sm">
            <Link
              href="#"
              className="font-medium text-brown-600 hover:text-brown-500"
            >
              Lupa password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-brown-600 hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500"
            style={{ backgroundColor: "#5D4037" }}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </div>

        <div className="text-sm text-center">
          <p className="text-gray-600">
            Belum punya akun?{" "}
            <Link
              href="/register"
              onClick={() => router.push("/register")}
              className="font-medium text-brown-600 hover:text-brown-500"
            >
              Daftar disini
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}