"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MyNavbar } from "@/components/ui/MyNavbar";
import { MyFooter } from "@/components/MyFooter";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Jalankan AOS sekali saat komponen pertama render
  useEffect(() => {
    AOS.init({ once: true });
  }, []);

  const hideNavbarOn = ["/login", "/register"];
  const shouldHideNavbar = hideNavbarOn.includes(pathname);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {!shouldHideNavbar && <MyNavbar />}
        {children}
        {!shouldHideNavbar && <MyFooter />}
      </body>
    </html>
  );
}
