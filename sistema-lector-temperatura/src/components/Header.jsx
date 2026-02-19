"use client";
import React from "react";

import { useAuth } from "../hooks/useAuth";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import Link from 'next/link';

const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="w-full px-4 md:px-8">
                <div className="flex items-center justify-between h-24">
                    {/* Logo */}
                    <div className="flex items-center gap-4">
                        <Link href="/incubadora" className="cursor-pointer">
                            <div className="relative w-auto h-20">
                                <img
                                    src="/images/logo_adl.png"
                                    alt="ADL Logo"
                                    className="object-contain w-full h-full"
                                />
                            </div>
                        </Link>
                        <div>
                            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Lector Temperatura</span>
                        </div>
                    </div>

                    {/* Right Side: Links + User Profile */}
                    <div className="flex items-center gap-6">

                        {user && (
                            <>
                                <Link href="/incubadora/subir" className="px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-sm font-medium text-sm block">
                                    Subir Temperatura
                                </Link>
                                <Link href="/incubadora/historial" className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm font-medium text-sm block">
                                    Historial
                                </Link>
                            </>
                        )}

                        {user && (
                            <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-gray-900 leading-none">{user.username}</p>
                                    <p className="text-xs text-gray-500 mt-1">{user.seccion || 'Sin Sección'}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-lg border border-sky-200">
                                    {user.username ? user.username.charAt(0).toUpperCase() : <FaUser />}
                                </div>
                                <button
                                    onClick={logout}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                                    title="Cerrar Sesión"
                                >
                                    <FaSignOutAlt size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
