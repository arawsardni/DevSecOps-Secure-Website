'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import AOS from 'aos'; // Pastikan AOS diimpor dengan benar
import 'aos/dist/aos.css'; // Pastikan CSS AOS diimpor

export default function AboutPage() {
  useEffect(() => {
    AOS.init({ once: true }); // Inisialisasi AOS pada mount
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section
        className="relative w-full flex flex-col lg:flex-row items-center justify-center px-6 py-16 lg:py-24 max-w-7xl mx-auto overflow-hidden"
        data-aos="fade-up"
      >
        <div className="relative w-full lg:w-1/2 h-[300px] lg:h-[500px]">
          <Image
            src="/forcoffi.png"
            alt="Forcoffi Interior"
            fill
            className="object-cover rounded-xl shadow-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-white via-white/70 to-transparent rounded-xl" />
        </div>
        <div className="lg:w-1/2 text-center lg:text-left space-y-5 px-4 lg:px-12 z-10">
          <p className="text-green-800 font-medium text-sm">
            About <span className="font-bold">Forcoffi</span>
          </p>
          <h1 className="text-5xl font-bold text-green-900">Our Story</h1>
          <p className="text-lg text-green-800">
            Get to know about us, our stores, environment, and the people behind it!
          </p>
        </div>
      </section>

      {/* Visi & Misi Section */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center space-y-20">
          <div className="space-y-6" data-aos="fade-up">
            <h2 className="text-4xl font-bold text-gray-800">Visi</h2>
            <p className="text-gray-700 text-lg max-w-3xl mx-auto">
              Menjadi brand kopi lokal paling dicintai yang menghadirkan cita rasa, kehangatan, dan keberlanjutan di setiap cangkir.
            </p>
          </div>

          <div className="space-y-8" data-aos="fade-up" data-aos-delay="100">
            <h2 className="text-4xl font-bold text-gray-800">Misi</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                "Menyediakan kopi berkualitas tinggi dari petani lokal.",
                "Mengutamakan keberlanjutan dalam setiap proses produksi.",
                "Menciptakan pengalaman ngopi yang nyaman dan berkesan.",
              ].map((misi, index) => (
                <div
                  key={index}
                  data-aos="zoom-in"
                  data-aos-delay={index * 100}
                  className="bg-white rounded-xl shadow-md p-6 text-gray-700 text-base transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {misi}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Nilai-nilai */}
      <section className="px-6 py-20 bg-orange-50">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-12 text-gray-800"
            data-aos="fade-up"
          >
            Apa yang Kami Junjung
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                img: "/petanii.jpg",
                title: "Kualitas",
                desc: "Kami memilih biji kopi terbaik dari petani lokal yang berkomitmen terhadap standar tertinggi.",
              },
              {
                img: "/beans.jpg",
                title: "Keberlanjutan",
                desc: "Kami berusaha meminimalkan jejak lingkungan dan mendukung praktik pertanian berkelanjutan.",
              },
              {
                img: "/customer.jpg",
                title: "Komunitas",
                desc: "Kami membangun komunitas yang kuat dan inklusif dengan pelanggan dan mitra kami.",
              },
            ].map((item, index) => (
              <div
                key={index}
                data-aos="zoom-in"
                data-aos-delay={index * 100}
                className="bg-white rounded-xl shadow-md px-3 py-5 text-center hover:shadow-lg hover:-translate-y-1 transition"
              >
                <Image
                  src={item.img}
                  alt={item.title}
                  width={300}
                  height={200}
                  className="mx-auto rounded-md mb-3"
                />
                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Developers */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-1xl mx-auto text-center space-y-20">
          <h2 className="text-3xl font-bold text-green-900 mb-8">About Developers</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              {
                img: "/oprix.jpg",
                name: "M Ridwan N",
                role: "Front-End Engineer",
              },
              {
                img: "/gaung.png",
                name: "Gaung Taqwa I",
                role: "Back-End Engineer & Database",
              },
              {
                img: "/wahyu.jpg",
                name: "M Wahyu Lillah",
                role: "Back-End Engineer",
              },
            ].map((dev, index) => (
              <div
                key={index}
                data-aos="fade-up"
                data-aos-delay={`${(index + 1) * 100}`}
                className="bg-gray-50 rounded-xl shadow-lg p-6 w-[250px] transition transform hover:-translate-y-1 hover:shadow-xl"
              >
                <Image
                  src={dev.img}
                  alt={dev.name}
                  width={150}
                  height={150}
                  className="mx-auto rounded-full mb-4 object-cover"
                />
                <h3 className="font-semibold text-lg text-gray-800">{dev.name}</h3>
                <p className="text-sm text-gray-500">{dev.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
