"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import Sidebar from "@/components/Sidebar";
import { Hero } from "../(Landing)/Hero";
import Link from "next/link";
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
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);
        console.log("Products dari API:", productsData);
        console.log("Categories dari API:", categoriesData);
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

  const handleCategoryChange = (category) => {
    if (!category) return setSelectedCategories([]);
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Log untuk debugging
  console.log("Products setelah setState:", products);
  console.log("Categories setelah setState:", categories);

  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-50 min-h-screen">
      <Hero />
      <Layout className="space-y-8">
        <div className="flex flex-col items-center mb-4">
          <button
            className="bg-amber-600 text-white px-4 py-2 rounded-md mb-4"
            onClick={() => setShowAllProducts(!showAllProducts)}
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
                <Link key={product.id} href={`/Product/${product.id}`}>
                  <ProductCard {...product} />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <Sidebar
              categories={categories}
              selected={selectedCategories}
              onChange={handleCategoryChange}
            />
            <div className="flex-1 space-y-12">
              {categories.length === 0 && (
                <p>Tidak ada kategori yang tersedia.</p>
              )}

              {categories
                .filter(
                  (cat) =>
                    selectedCategories.length === 0 ||
                    selectedCategories.includes(cat.name)
                )
                .map((cat) => {
                  // Gunakan category_name untuk filter produk
                  const filteredProducts = products.filter(
                    (p) => p.category_name === cat.name
                  );
                  console.log(
                    `Kategori: ${cat.name}, Jumlah produk: ${filteredProducts.length}`
                  );

                  return (
                    <div key={cat.id}>
                      <h2 className="font-bold text-xl mb-2">{cat.name}</h2>
                      <p className="text-sm text-gray-500 mb-4">
                        {cat.description}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
                        {filteredProducts.length === 0 && (
                          <p>Tidak ada produk dalam kategori ini.</p>
                        )}

                        {filteredProducts.map((product) => (
                          <Link
                            key={product.id}
                            href={`/Product/${product.id}`}
                          >
                            <ProductCard {...product} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </Layout>
    </div>
  );
}
