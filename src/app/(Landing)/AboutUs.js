import Image from "next/image";

export default function AboutUs() {
  return (
    <section className="flex flex-col items-center text-center px-6 md:px-16 py-12 bg-white">
      {/* Teks About Us */}
      <div className="w-full md:w-3/4 lg:w-2/3">
        <h2 className="text-2xl font-bold text-gray-900">About Us</h2>
        <p className="mt-4 text-gray-600">
          Selamat datang di <span className="text-[#8B4513] font-semibold">Forcoffi</span>, tempat di mana kopi terbaik 
          bertemu dengan ambience yang luar biasa. Kami berdedikasi untuk menghadirkan 
          kopi berkualitas tinggi dengan cita rasa yang khas dan autentik.  
        </p>
      </div>

      {/* Gambar di bawah */}
      <div className="w-full flex justify-center mt-6">
        <div className="relative w-full md:w-3/4 lg:w-2/3 h-[250px] md:h-[350px]">
          <Image 
            src="/kopi-fore.png" 
            alt="About Us" 
            layout="fill"
            objectFit="cover"
            className="rounded-lg shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}
