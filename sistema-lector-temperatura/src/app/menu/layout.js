"use client";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import "../globals.css";
import useIsMobile from "@/hooks/useIsMobile";
import { useRouter } from "next/navigation";
import { jwtDecode } from 'jwt-decode';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MenuLayout = ({ children }) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");

    if (!token) {
      router.push("/");
      return;
    }

    try {
      const decodedUser = jwtDecode(token);
      const userSection = decodedUser.seccion;

      if (userSection !== 'INF' && userSection !== 'APO') {
        console.warn(`Acceso denegado en Menu: Usuario ${userSection}`);
        router.push("/");
        return;
      }

      setLoading(false);

    } catch (error) {
      console.error("Token inválido o expirado en Layout Menu:", error);
      router.push("/");
      return;
    }
  }, [router]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Footer />
    </div>
  );
};

export default MenuLayout;
