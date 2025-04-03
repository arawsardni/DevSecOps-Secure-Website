"use client";

import { Button, Navbar, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export function MyNavbar() {
    const [cartCount, setCartCount] = useState(0);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        setCartCount(totalItems);
    }, []);

    const links = [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Menu", href: "/Product" },
        { name: "Contact", href: "/Contact" },
    ];
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = (e) => {
        if (e.key === "Enter" && searchTerm.trim() !== "") {
            router.push(`/Product?search=${encodeURIComponent(searchTerm.trim())}`);
        }
    };
    return (
        <Navbar fluid rounded className="bg-white text-[#5A2E0D] sticky top-0 z-50 shadow-sm">
            {/* Brand */}
            <Navbar.Brand as={Link} href="/">
                <img src="/Logo.png" className="mr-3 h-6 sm:h-9" alt="Forcoffi Logo" />
                <span className="self-center whitespace-nowrap text-xl font-semibold text-[#8B4513]">Forcoffi</span>
            </Navbar.Brand>

            {/* Search */}
            <div className="mx-4 hidden md:block max-w-3xl w-full">
                <TextInput 
                    type="search" 
                    placeholder="Cari kopi kesukaanmu..." 
                    className="w-full"
                    sizing="md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearch}
                />
            </div>

            {/* Right */}
            <div className="flex md:order-2 space-x-4 items-center">
                {/* Cart */}
                <button onClick={() => router.push("/Cart")} className="relative">
                    <img src="../Cart.png" className="w-7 h-7" alt="Cart" />
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 text-xs">
                            {cartCount}
                        </span>
                    )}
                </button>
                <Button className="bg-[#5A2E0D] hover:bg-[#3B1E09] text-white">Login</Button>
                <Navbar.Toggle />
            </div>

            {/* Navbar Links */}
            <Navbar.Collapse>
                {links.map((link) => (
                    <Navbar.Link
                        key={link.name}
                        as={Link}
                        href={link.href}
                        className={pathname === link.href ? "!text-[#8B4513] font-semibold" : ""}
                    >
                        {link.name}
                    </Navbar.Link>
                ))}
            </Navbar.Collapse>
        </Navbar>
    );
}
