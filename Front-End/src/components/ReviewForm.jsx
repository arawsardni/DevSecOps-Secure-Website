"use client";

import { useState, useEffect } from "react";
import { addProductReview, updateProductReview } from "@/services/api";

export default function ReviewForm({
  productId,
  productName,
  originalReview = null,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(originalReview ? originalReview.rating : 5);
  const [comment, setComment] = useState(originalReview ? originalReview.comment : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    // Deteksi apakah ini mode update atau tambah review baru
    if (originalReview) {
      setIsUpdate(true);
      setRating(originalReview.rating || 5);
      setComment(originalReview.comment || "");
    }
  }, [originalReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    // Validate input
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
      // Check for authentication
      const token = localStorage.getItem("access_token");
      const userId = localStorage.getItem("user_id");
      
      if (!token || !userId) {
        throw new Error("Silakan login terlebih dahulu untuk memberikan review");
      }

      // Create review data
      const reviewData = {
        productId, // This is the product ID
        userId,    // This is saved for localStorage backup
        rating: Number(rating),
        comment,
      };

      let submittedReview;
      
      if (isUpdate && originalReview && originalReview.id) {
        // Update existing review
        submittedReview = await updateProductReview(originalReview.id, reviewData);
        setSuccess(`Review berhasil diperbarui! Terima kasih atas masukan Anda.`);
      } else {
        // Create new review
        submittedReview = await addProductReview(reviewData);
        setSuccess(`Review berhasil ditambahkan! Terima kasih atas masukan Anda.`);
      }
      
      // Update UI
      setSuccess(true);
      
      // Reset form if it's a new review
      if (!isUpdate) {
        setRating(5);
        setComment("");
      }

      // Call the callback to refresh parent component
      if (typeof onReviewSubmitted === "function") {
        onReviewSubmitted(submittedReview);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err.message || "Gagal mengirim review. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="font-semibold text-lg mb-3">
        {isUpdate ? "Edit Review untuk " : "Tambahkan Review untuk "} 
        {productName}
      </h3>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">
          {success}
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
          {isSubmitting ? "Mengirim..." : isUpdate ? "Perbarui Review" : "Kirim Review"}
        </button>
      </form>
    </div>
  );
}
