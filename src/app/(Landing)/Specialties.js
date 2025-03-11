import Image from "next/image";

export function Specialties() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-white w-full max-w-[1200px] mx-auto">
      {/* Left Content */}
      <div className="md:w-1/2 text-center md:text-left space-y-4">
        <h2 className="text-2xl font-bold">Discover Our Specialties</h2>
        <p className="text-gray-600">
          Jelajahi berbagai varian kopi dan makanan pilihan kami yang dibuat dengan bahan berkualitas terbaik.
        </p>
        <button className="bg-[#8B4513] hover:bg-[#6D3310] text-white px-6 py-2 rounded-md">
          Lihat Menu
        </button>
      </div>

      {/* Right Image */}
      <div className="md:w-1/2 flex justify-end mt-6 md:mt-0">
        <Image 
          src="/kopi-fore.png" 
          alt="Specialties" 
          width={400} 
          height={300} 
          className="rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
}
