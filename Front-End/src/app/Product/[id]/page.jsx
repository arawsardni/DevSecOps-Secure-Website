"use client";
import { useParams } from "next/navigation";
import { products } from "../data";
import ReviewProductCard from "@/components/ReviewProductCard";
import { useState, useEffect } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import BuyButton from "@/components/BuyButton";


export default function ProductDetail() {
    const { id } = useParams();
    const product = products.find(p => p.id === parseInt(id));

    if (!product) return <div>Product tidak ditemukan</div>;

    const avgRating = (product.reviews?.reduce((acc, r) => acc + r.rating, 0) || 0) / (product.reviews?.length || 1);

    // States for sorting, pagination, and loading
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const reviewsPerPage = 5; // Limit the reviews per page
    const totalPages = Math.ceil(product.reviews?.length / reviewsPerPage);

    // Sorting function
    const sortedReviews = product.reviews?.sort((a, b) => {
        if (sortBy === "newest") {
            return new Date(b.date) - new Date(a.date); // Latest first
        }
        return new Date(a.date) - new Date(b.date); // Oldest first
    });

    // Paginate reviews
    const reviewsToDisplay = sortedReviews?.slice(
        (currentPage - 1) * reviewsPerPage,
        currentPage * reviewsPerPage
    );

    // Function to handle "Show More" pagination
    const handleShowMore = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        } else {
            setCurrentPage(1); // Reset back to the first page or show all if needed
        }
    };
    
    // Handle sorting by newest/oldest
    const handleSortChange = (sortOption) => {
        setSortBy(sortOption);
        setCurrentPage(1); // Reset to the first page after sorting
    };

    useEffect(() => {
        setLoading(false); // Stop loading when data is fetched
    }, [product]);

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row gap-8 shadow rounded-lg p-4 bg-white">

                {/* Image */}
                <div className="flex-1">
                    <img src={product.image} alt={product.title} className="rounded-xl w-full max-h-[450px] object-cover border" />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                    <h1 className="text-3xl font-bold leading-tight">{product.title}</h1>
                    <p className="text-green-600 text-2xl font-semibold">Rp {product.price}</p>
                    <p className="text-gray-500 text-sm">Terjual: {product.sold}+</p>
                    <div className="flex items-center gap-1 text-yellow-500">
                        {"★".repeat(product.rating)}{"☆".repeat(5 - product.rating)}
                    </div>
                    {product.badge && <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">{product.badge}</span>}
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{product.description}</p>

                                        {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                        <AddToCartButton product={product} />
                        <BuyButton product={product} />
                    </div>
                </div>

            </div>

            {/* Review Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border space-y-2">
                <h2 className="font-semibold text-lg">Ulasan Pembeli</h2>
                <div className="flex items-center gap-2">
                    <p className="text-yellow-500 text-xl font-bold">{avgRating.toFixed(1)}</p>
                    <p className="text-yellow-500">{"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}</p>
                    <p className="text-gray-400 text-sm">({product.reviews?.length || 0} ulasan)</p>
                </div>
                <div className="flex gap-4 pt-2">
                    <button onClick={() => handleSortChange("newest")} className="text-sm text-gray-500">Terbaru</button>
                    <button onClick={() => handleSortChange("oldest")} className="text-sm text-gray-500">Terlama</button>
                </div>
            </div>

            {/* Review List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="space-y-4">
                        {/* Skeleton Loading */}
                        <div className="skeleton-card"></div>
                        <div className="skeleton-card"></div>
                        <div className="skeleton-card"></div>
                    </div>
                ) : (
                    reviewsToDisplay?.length > 0 ? (
                        reviewsToDisplay?.map((r, i) => (
                            <ReviewProductCard key={i} user={r.user} rating={r.rating} comment={r.comment} date={r.date} />
                        ))
                    ) : (
                        <p className="text-sm text-gray-400">Belum ada review</p>
                    )
                )}
            </div>


            {/* Pagination */}
            {reviewsToDisplay?.length > 0 && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={handleShowMore}
                        className="text-blue-500 text-sm"
                    >
                        Lihat Semua Ulasan
                    </button>
                </div>
            )}

        </div>
    );
}
