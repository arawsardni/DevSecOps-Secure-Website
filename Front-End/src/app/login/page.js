import React from "react";
import Layout from "../layout.js";
import LoginForm from "./LoginForm.js";

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Login ke Forcoffi
          </h1>
          <p className="text-gray-600 mb-6">
            Masuk ke akun Anda untuk menikmati kopi berkualitas tinggi
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
