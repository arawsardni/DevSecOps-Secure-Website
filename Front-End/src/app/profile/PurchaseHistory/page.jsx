"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserPurchaseHistory } from "@/services/orderService";
import { formatRupiah } from "@/utils/formatters";
import Link from "next/link";

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    // Redirect ke halaman profil karena fitur ini sudah tidak digunakan
    router.push("/profile");
  }, [router, isClient]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <p>Mengalihkan ke halaman profil...</p>
      </div>
    </div>
  );
}
