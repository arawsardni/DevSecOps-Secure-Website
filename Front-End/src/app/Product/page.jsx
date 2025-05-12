"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import Sidebar from "@/components/Sidebar";
import { Hero } from "../(Landing)/Hero";
import { getProducts, getCategories } from "@/services/api";

export default function Page() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);
        console.log("Products from API:", productsData);
        console.log("Categories from API:", categoriesData);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle category selection
  const handleCategoryChange = (category) => {
    if (!category) {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Filter products based on selected categories
  const filteredProducts =
    selectedCategories.length > 0
      ? products.filter((product) =>
          selectedCategories.includes(product.category_name)
        )
      : products;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6 bg-gray-50 min-h-screen">
        <Hero />
        <Layout>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="border rounded p-2">
                  <div className="h-48 bg-gray-200 rounded-md"></div>
                  <div className="mt-2 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 p-6 bg-gray-50 min-h-screen">
        <Hero />
        <Layout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Terjadi Kesalahan
            </h2>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-50 min-h-screen">
      <Hero />
      <Layout className="space-y-8">
        <div className="flex flex-col items-center mb-4">
          <button
            className="bg-amber-600 text-white px-4 py-2 rounded-md mb-4"
            onClick={() => {
              setShowAllProducts(!showAllProducts);
              // Reset filter saat beralih ke tampilan semua produk
              if (showAllProducts) {
                setSelectedCategories([]);
              }
            }}
          >
            {showAllProducts
              ? "Tampilkan Produk per Kategori"
              : "Tampilkan Semua Produk"}
          </button>

          {products.length === 0 && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
              Tidak ada produk yang ditemukan dari API
            </div>
          )}
        </div>

        {showAllProducts ? (
          <div>
            <h2 className="font-bold text-xl mb-4">
              Semua Produk ({products.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex gap-6">
            <Sidebar
              categories={categories}
              selected={selectedCategories}
              onChange={handleCategoryChange}
            />

            <div className="flex-1">
              {selectedCategories.length > 0 ? (
                <div className="space-y-8">
                  {categories
                    .filter((category) =>
                      selectedCategories.includes(category.name)
                    )
                    .map((category) => {
                      const categoryProducts = products.filter(
                        (p) => p.category_name === category.name
                      );

                      return (
                        <div key={category.id}>
                          <h2 className="font-bold text-xl mb-4">
                            {category.name} ({categoryProducts.length})
                          </h2>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
                            {categoryProducts.map((product) => (
                              <ProductCard key={product.id} {...product} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="space-y-8">
                  {categories.map((category) => {
                    const categoryProducts = products.filter(
                      (p) => p.category_name === category.name
                    );
                    if (categoryProducts.length === 0) return null;

                    return (
                      <div key={category.id}>
                        <h2 className="font-bold text-xl mb-4">
                          {category.name} ({categoryProducts.length})
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
                          {categoryProducts.map((product) => (
                            <ProductCard key={product.id} {...product} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Layout>
    </div>
  );
}
