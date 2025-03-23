import CardComponent from "@/components/CardComponent";
import Image from "next/image";

export function Recommended() {
  const products = [
    {
      imgSrc: "/Fore-Double-Iced-Shaken-Latte.jpg",
      title: "Double Iced Shaken Latte",
      rating: "5.0",
      price: "32.000",
    },
    {
      imgSrc: "/Fore-Capucino-Iced.jpg",
      title: "Cappucino Latte",
      rating: "4.8",
      price: "29.000",
    },
    {
      imgSrc: "/Fore-Ice-Milo.jpg",
      title: "Ice Milo",
      rating: "4.7",
      price: "20.000",
    },
  ];

  return (
    <div className="flex flex-row gap-6 justify-center my-16 w-3/4 mx-auto">
      {products.map((product, index) => (
        <CardComponent
          key={index}
          imgSrc={product.imgSrc}
          title={product.title}
          rating={product.rating}
          price={product.price}
        />
      ))}
    </div>
  );
}
