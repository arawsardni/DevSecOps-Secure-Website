// components/Recommended.jsx
import CardComponent from "@/components/CardComponent";
import { products } from "@/app/Product/data"; // pastikan path-nya benar

export function Recommended() {
  // Filter contoh: hanya tampilkan 3 produk teratas dari kategori Coffee Series
  const recommendedItems = products
    .filter((item) => item.category === "Coffee Series")
    .slice(0, 3);

  return (
    <div className="flex flex-wrap gap-6 justify-center my-16 w-11/12 mx-auto">
      {recommendedItems.map((item) => (
        <CardComponent
          key={item.id}
          imgSrc={item.image}
          title={item.title}
          rating={item.rating}
          price={item.price}
        />
      ))}
    </div>
  );
}
