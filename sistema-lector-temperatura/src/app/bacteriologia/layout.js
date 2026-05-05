"use client";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import "../globals.css";
import useIsMobile from "@/hooks/useIsMobile";
import { useRouter } from "next/navigation";
import { jwtDecode } from 'jwt-decode';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const IncubadoraLayout = ({ children }) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // ⬇️ LÓGICA DE SEGURIDAD: VERIFICACIÓN DE TOKEN Y SECCIÓN
    const token = Cookies.get("token");

    if (!token) {
      // Redirigir si no hay token (sesión no iniciada)
      router.push("/");
      return;
    }

    try {
      // Decodificar el token para leer la sección
      const decodedUser = jwtDecode(token);
      const userSection = decodedUser.seccion;

      // --- CAMBIO AQUÍ: Validamos que sea INF ---
      if (userSection !== 'INF') {
        console.warn(`Acceso denegado: Usuario ${userSection} intentó acceder a Incubadora.`);
        router.push("/");
        return;
      }

      // ⬆️ FIN LÓGICA DE SEGURIDAD
      setLoading(false);

    } catch (error) {
      console.error("Token inválido o expirado en Layout Incubadora:", error);
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
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
};

export default IncubadoraLayout;