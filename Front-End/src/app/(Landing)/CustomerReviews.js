import Image from "next/image";
import React from "react";
import ReviewCard from "@/components/ReviewCard";

const CustomerReviews = () => {
  return (
    <div className="max-w-3/4 mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Apa kata pelanggan?
      </h2>
      <div className="flex flex-wrap justify-center gap-6">
        <ReviewCard 
          name="Andi Pratama"
          rating={5}
          title="Kopi terbaik yang pernah saya coba!"
          reviewText="Aromanya luar biasa, rasanya kaya dan seimbang. Saya biasanya tidak terlalu suka kopi hitam, tapi ini benar-benar enak!"
          additionalText="Pasti akan beli lagi! Cocok untuk dinikmati saat pagi hari atau saat kerja."
        />
        <ReviewCard 
          name="Siti Nurhaliza"
          rating={4}
          title="Enak, tapi agak pahit"
          reviewText="Kualitas kopinya sangat bagus, tetapi bagi saya sedikit lebih pahit dari yang saya harapkan."
          additionalText="Mungkin cocok untuk yang suka kopi strong. Tapi tetap nikmat dengan sedikit gula."
        />
        <ReviewCard 
          name="Rizky Ramadhan"
          rating={5}
          title="Kopi ini bikin hari saya lebih semangat!"
          reviewText="Rasanya bold dan berkarakter, cocok untuk pecinta kopi sejati."
          additionalText="Setiap pagi saya selalu menikmati secangkir kopi ini, membuat saya lebih fokus bekerja!"
        />
      </div>
    </div>
  );
};

export default CustomerReviews;
