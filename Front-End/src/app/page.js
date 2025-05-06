"use client";
import Image from "next/image";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Hero } from "./(Landing)/Hero";
import { Specialties } from "./(Landing)/Specialties";
import AboutUs from "./(Landing)/AboutUs";
import OurStory from "./(Landing)/OurStory";
import CustomerReviews from "./(Landing)/CustomerReviews";

export default function Home() {
  useEffect(() => {
    AOS.init({ once: true });
  }, []);

  return (
    <div className="mb-20">
      <div className="flex flex-col space-y-20 max-w-[1200px] w-full mx-auto px-4">
        <div data-aos="fade-up"><Hero /></div>
        <div data-aos="fade-up" data-aos-delay="100"><AboutUs /></div>
        <div data-aos="fade-up" data-aos-delay="200"><Specialties /></div>
        <div data-aos="fade-up" data-aos-delay="500"><CustomerReviews /></div>
      </div>
    </div>
  );
}