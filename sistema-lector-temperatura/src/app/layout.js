import { Inter } from "next/font/google";
import React from "react";
import ToastProvider from "../components/ToastProvider"; 
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Lector Temperatura ADL",
  description: "Sistema Lector Temperatura ADL",
};

const RootLayout = ({ children }) => {
  return (
    <html lang="es">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"></meta>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body
        className={`font-sans ${inter.className} bg-zinc-50 text-gray-800`}
      >
        {/* ENVUELVE EL CONTENIDO CON EL PROVIDER DE CLIENTE */}
        <ToastProvider>
            <main>{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
};

export default RootLayout;