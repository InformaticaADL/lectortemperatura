"use client";
import "../globals.css";
import React from "react";
import useIsMobile from "@/hooks/useIsMobile";
import SessionExpiredModal from "@/components/SessionExpiredModal";
import { useRouter } from "next/navigation";
import "react-toastify/dist/ReactToastify.css";
import useTokenVerification from "@/hooks/useTokenVerification";
import { FaBoxOpen, FaMicroscope, FaFlask } from 'react-icons/fa';
import Cookies from "js-cookie";

export default function MenuPrincipal() {
    const isMobile = useIsMobile();
    const { sessionModalVisible, handleSessionModalOk } = useTokenVerification();
    const router = useRouter();
    
    // Check section from cookies
    const userSection = Cookies.get("seccion") || "";

    return (
        <div className="flex w-full min-h-screen items-center justify-start pt-20 text-sky-900 flex-col p-4 bg-gray-50">

            <h2 className="text-3xl font-bold mb-8 text-sky-800">Menú Principal</h2>

            <div className={`grid gap-8 ${isMobile ? 'grid-cols-1 w-full' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-11/12 max-w-6xl'}`}>

                {/* Opción 1: Cultivo Celular (Solo INF) */}
                {userSection === "INF" && (
                    <div
                        onClick={() => router.push('/incubadora')}
                        className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col items-center justify-center border-2 border-transparent hover:border-sky-400 group transform hover:-translate-y-1"
                    >
                        <div className="p-6 rounded-full bg-sky-50 group-hover:bg-sky-500 transition-colors mb-6 shadow-inner">
                            <FaMicroscope className="text-6xl text-sky-600 group-hover:text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-sky-900 text-center">Cultivo Celular</h3>
                        <p className="text-base text-gray-500 text-center px-4">
                            Gestión y lectura de temperaturas para Incubadoras.
                        </p>
                    </div>
                )}

                {/* Opción Nueva: Bacteriología (Solo INF) */}
                {userSection === "INF" && (
                    <div
                        onClick={() => router.push('/bacteriologia')}
                        className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col items-center justify-center border-2 border-transparent hover:border-indigo-400 group transform hover:-translate-y-1"
                    >
                        <div className="p-6 rounded-full bg-indigo-50 group-hover:bg-indigo-500 transition-colors mb-6 shadow-inner">
                            <FaFlask className="text-6xl text-indigo-600 group-hover:text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-indigo-900 text-center">Bacteriología</h3>
                        <p className="text-base text-gray-500 text-center px-4">
                            Gestión y lectura de temperaturas para Bacteriología.
                        </p>
                    </div>
                )}

                {/* Opción 2: Unidad de Apoyo */}
                <div
                    onClick={() => router.push('/apoyo')}
                    className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col items-center justify-center border-2 border-transparent hover:border-teal-400 group transform hover:-translate-y-1"
                >
                    <div className="p-6 rounded-full bg-teal-50 group-hover:bg-teal-500 transition-colors mb-6 shadow-inner">
                        <FaBoxOpen className="text-6xl text-teal-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-teal-900">Unidad de Apoyo</h3>
                    <p className="text-base text-gray-500 text-center px-4">
                        Gestión y procesamiento de archivos planos de Unidades de Apoyo.
                    </p>
                </div>

            </div>

            <SessionExpiredModal
                isVisible={sessionModalVisible}
                onOk={handleSessionModalOk}
            />
        </div>
    );
}
