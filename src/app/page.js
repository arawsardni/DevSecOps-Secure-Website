import Image from "next/image";
import { Hero } from "./(Landing)/Hero";
import { Recommended } from "./(Landing)/Recommended"; 
import { Specialties } from "./(Landing)/Specialties";
import AboutUs from "./(Landing)/AboutUs";
import OurStory from "./(Landing)/OurStory";
import CustomerReviews from "./(Landing)/CustomerReviews";

export default function Home() {
  return (
    <div className="flex flex-col space-y-20 mb-20">
      <Hero />
      <AboutUs />
      <Specialties />
      <Recommended />
      <OurStory />
      <CustomerReviews />
    </div>
  );
}
