"use client";

import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import Sidebar from '@/components/Sidebar';
import { Hero } from "../(Landing)/Hero";
import { products, categories } from '@/app/Product/data';
import Link from 'next/link';

export default function Page() {
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    AOS.init({ once: true, duration: 600 });
    setTimeout(() => AOS.refresh(), 500); // Untuk memastikan refresh setelah render
  }, []);

  const handleCategoryChange = (category) => {
    if (!category) return setSelectedCategories([]);
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-50 min-h-screen">
      {/* Hero with AOS */}
      <div data-aos="fade-up">
        <Hero />
      </div>

      <Layout className="space-y-8">
        <div className="flex gap-4">
          {/* Sidebar (Optional with AOS) */}
          <div data-aos="fade-right">
            <Sidebar
              categories={categories}
              selected={selectedCategories}
              onChange={handleCategoryChange}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1 space-y-12">
            {categories
              .filter(cat => selectedCategories.length === 0 || selectedCategories.includes(cat))
              .map((cat, i) => (
                <div key={cat} data-aos="fade-up" data-aos-delay={i * 100}>
                  <h2 className="font-bold text-xl mb-2">{cat}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
                    {products
                      .filter(p => p.category === cat)
                      .map((product, index) => (
                        <div
                          key={product.id}
                          data-aos="zoom-in"
                          data-aos-delay={index * 50}
                        >
                          <Link href={`/Product/${product.id}`}>
                            <ProductCard {...product} />
                          </Link>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </Layout>
    </div>
  );
}
