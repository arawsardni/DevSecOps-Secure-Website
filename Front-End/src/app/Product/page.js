"use client";

import { useState } from 'react';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import Sidebar from '@/components/Sidebar';
import { Hero } from "../(Landing)/Hero";
import { products, categories } from './data';
import Link from 'next/link';
// Contoh baca di Product
import { useSearchParams } from "next/navigation";


export default function Page() {
    const [selectedCategories, setSelectedCategories] = useState([]);

    const handleCategoryChange = (category) => {
        if (!category) return setSelectedCategories([]);
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
        );
    };

    return (
        <div className="flex flex-col gap-4 p-6 bg-gray-50 min-h-screen">
            <Hero />
            <Layout className="space-y-8">
                <div className="flex gap-4">
                    <Sidebar categories={categories} selected={selectedCategories} onChange={handleCategoryChange} />
                    <div className="flex-1 space-y-12">
                        {categories.filter(cat => selectedCategories.length === 0 || selectedCategories.includes(cat)).map((cat) => (
                            <div key={cat}>
                                <h2 className="font-bold text-xl mb-2">{cat}</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
                                    {products.filter(p => p.category === cat).map(product => (
                                        <Link key={product.id} href={`/Product/${product.id}`}>
                                            <ProductCard {...product} />
                                        </Link>
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
