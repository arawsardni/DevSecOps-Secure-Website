"use client";

import { useState } from "react";
import { addProductReview } from "@/services/api";

export default function ReviewForm({
  productId,
  productName,
  originalProduct = null,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    // Validasi input
    if (rating < 1 || rating > 5) {
      setError("Rating harus antara 1-5");
      setIsSubmitting(false);
      return;
    }

    if (!comment.trim()) {
      setError("Komentar tidak boleh kosong");
      setIsSubmitting(false);
      return;
    }

    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) throw new Error("Silakan login terlebih dahulu");

      // Get user data
      let user = "Pengguna";
      try {
        const userData = JSON.parse(localStorage.getItem("user_data"));
        if (userData && userData.name) {
          user = userData.name;
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
      }

      const reviewData = {
        productId,
        userId,
        user,
        rating: Number(rating),
        comment,
        alternate_product_ids: originalProduct
          ? [originalProduct.id, originalProduct.product_id]
              .filter(Boolean)
              .map(String)
          : [],
      };

      await addProductReview(reviewData);

      setSuccess(true);
      setRating(5);
      setComment("");

      // Call the callback
      if (typeof onReviewSubmitted === "function") {
        onReviewSubmitted();
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="font-semibold text-lg mb-3">
        Tambahkan Review untuk {productName}
      </h3>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">
          Review berhasil ditambahkan!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="text-2xl focus:outline-none"
              >
                <span
                  className={
                    value <= rating ? "text-yellow-500" : "text-gray-300"
                  }
                >
                  ★
                </span>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">({rating}/5)</span>
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-1">
            Komentar
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="4"
            className="w-full border rounded-lg p-2"
            placeholder="Bagikan pengalaman Anda dengan produk ini..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 rounded-lg text-white ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-amber-600 hover:bg-amber-700"
          }`}
        >
          {isSubmitting ? "Mengirim..." : "Kirim Review"}
        </button>
      </form>
    </div>
  );
}
