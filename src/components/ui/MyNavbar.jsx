"use client";

import { Button, Navbar, TextInput } from "flowbite-react";

export function MyNavbar() {
  return (
    <Navbar
      fluid
      rounded
      className="bg-white text-[#5A2E0D]" // Background putih, teks coklat tua
    >
      {/* Brand */}
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

      {/* Search Bar */}
      <div className="mx-4 hidden md:block max-w-3xl w-full">
        <TextInput
          type="search"
          placeholder="Cari kopi kesukaanmu..."
          className="w-full"
          sizing="md"
        />
      </div>

      {/* Button & Toggle */}
      <div className="flex md:order-2 space-x-2">
        <Button className="bg-[#5A2E0D] hover:bg-[#3B1E09] text-white">
          Login
        </Button>
        <Navbar.Toggle />
      </div>

      {/* Navbar Link */}
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
