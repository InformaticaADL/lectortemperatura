"use client";
import React from "react";

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">ADL Diagnostic Chile SpA</span>. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;
