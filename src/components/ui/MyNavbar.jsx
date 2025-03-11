"use client";

import { Button, Navbar } from "flowbite-react";
import Image from "next/image";

export function MyNavbar() {
  return (
    <Navbar
      fluid
      rounded
      className="bg-white text-[#5A2E0D]" // Background putih, teks coklat tua
    >
      <Navbar.Brand href="">
        <img
          src="/Logo.png"
          className="mr-3 h-6 sm:h-9"
          alt="Forcoffi Logo"
        />
        <span className="self-center whitespace-nowrap text-xl font-semibold text-[#8B4513]">
          Forcoffi
        </span>
      </Navbar.Brand>
      <div className="flex md:order-2">
        <Button className="bg-[#5A2E0D] hover:bg-[#3B1E09] text-white">
          Login
        </Button>
        <Navbar.Toggle />
      </div>
      <Navbar.Collapse>
        <Navbar.Link href="#" active className="!text-[#D2B48C]">
          Home
        </Navbar.Link>
        <Navbar.Link href="#" className="text-[#5A2E0D]">
          About
        </Navbar.Link>
        <Navbar.Link href="#" className="text-[#5A2E0D]">
          Menu
        </Navbar.Link>
        <Navbar.Link href="#" className="text-[#5A2E0D]">
          Buy
        </Navbar.Link>
        <Navbar.Link href="#" className="text-[#5A2E0D]">
          Contact
        </Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}
