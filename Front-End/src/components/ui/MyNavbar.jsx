//myNavbar

"use client";

import { Button, Dropdown, Navbar, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export function MyNavbar() {
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkUser = () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setUser(storedUser);
    };

    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(totalItems);
    };

    const updateUser = () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setUser(storedUser || null);
    };

    updateCartCount();
    updateUser();

    window.addEventListener("storage", () => {
      updateCartCount();
      updateUser();
    });

    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
        router.push(`/Product?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const links = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Menu", href: "/Product" },
    { name: "Contact", href: "/Contact" },
  ];

  return (
    <Navbar
      fluid
      rounded
      className="bg-white text-[#5A2E0D] sticky top-0 z-50 shadow-sm"
    >
      {/* Brand */}
      <Navbar.Brand as={Link} href="/">
        <img src="/Logo.png" className="h-6 mr-3 sm:h-9" alt="Forcoffi Logo" />
        <span className="self-center whitespace-nowrap text-xl font-semibold text-[#8B4513]">
          Forcoffi
        </span>
      </Navbar.Brand>

      {/* Right Side */}
      <div className="flex items-center space-x-4 md:order-2">
        {/* Navbar Links */}
        <Navbar.Collapse>
          {links.map((link) => (
            <Navbar.Link
              key={link.name}
              as={Link}
              href={link.href}
              className={
                pathname === link.href ? "!text-[#8B4513] font-semibold" : ""
              }
            >
              {link.name}
            </Navbar.Link>
          ))}
        </Navbar.Collapse>
        {/* Cart */}
        <button onClick={() => router.push("/Cart")} className="relative">
          <img src="/Cart.png" className="w-7 h-7" alt="Cart" />
          {cartCount > 0 && (
            <span className="absolute px-2 text-xs text-white bg-red-500 rounded-full -top-2 -right-2">
              {cartCount}
            </span>
          )}
        </button>

        {/* Login / Avatar */}
        {user ? (
          <Dropdown
            label={
              <img
                src={user.avatar || "/avatar-default.png"}
                alt="Avatar"
                className="object-cover w-8 h-8 rounded-full"
              />
            }
            inline
          >
            <Dropdown.Header>
              <span className="block text-sm">{user.name}</span>
              <span className="block text-sm font-medium truncate">
                {user.email}
              </span>
            </Dropdown.Header>
            <Dropdown.Item onClick={() => router.push("/profile")}>
              Profile
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => {
                setUser(null);
                localStorage.removeItem("user");
                router.push("/");
              }}
            >
              Logout
            </Dropdown.Item>
          </Dropdown>
        ) : (
          <Link href="/login" passHref>
            <Button className="bg-[#5A2E0D] hover:bg-[#3B1E09] text-white">
              Login
            </Button>
          </Link>
        )}

        <Navbar.Toggle />
      </div>
    </Navbar>
  );
}