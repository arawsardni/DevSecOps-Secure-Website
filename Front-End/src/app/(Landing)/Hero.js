"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Carousel } from "flowbite-react";


const images = [
  "/kopi-fore.png",
  "/Barista.jpg", // Akses langsung dari public/
];

export function Hero() {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(images.length);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
      <div className="h-56 sm:h-64 xl:h-80 2xl:h-96 w-3/4 mx-auto my-4">
        <Carousel pauseOnHover>
          <Image src="/kopi-fore.png" alt="..." width={10000} height={10000} className="max-w-full"/>
          <Image src="/Barista.jpg" alt="..." width={1000} height={1000} className="max-w-full"/>
          <Image src="https://flowbite.com/docs/images/carousel/carousel-3.svg" alt="..." width={500} height={500}/>
          <Image src="https://flowbite.com/docs/images/carousel/carousel-4.svg" alt="..." width={500} height={500}/>
          <Image src="https://flowbite.com/docs/images/carousel/carousel-5.svg" alt="..." width={500} height={500}/>
        </Carousel>
      </div>
  );
}
