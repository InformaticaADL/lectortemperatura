"use client";
import "../globals.css";
import React from "react";
import useIsMobile from "@/hooks/useIsMobile";
import SessionExpiredModal from "@/components/SessionExpiredModal";
import { useRouter } from "next/navigation";
import "react-toastify/dist/ReactToastify.css";
import useTokenVerification from "@/hooks/useTokenVerification";
import { FaCloudUploadAlt, FaHistory, FaCheckCircle, FaChartBar } from 'react-icons/fa';

export default function ApoyoHome() {
    const isMobile = useIsMobile();
    const { sessionModalVisible, handleSessionModalOk } = useTokenVerification();
    const router = useRouter();

    return (
        <div className="flex w-full min-h-screen items-center justify-start pt-6 text-teal-900 flex-col p-0 bg-gray-50">

            <div className="w-full max-w-5xl mb-8 mt-4 px-4 md:px-8">
                <div className="mb-2 -ml-2">
                    <button
                        onClick={() => router.push('/menu')}
                        className="group flex items-center gap-1.5 text-slate-500 hover:text-teal-600 bg-transparent hover:bg-teal-50 px-4 py-1.5 rounded-full transition-all text-sm font-semibold tracking-wide w-fit border border-transparent hover:border-teal-100"
                    >
                        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Volver al Menú Principal
                    </button>
                </div>
                <h2 className="text-2xl font-bold">Menú Unidad de Apoyo</h2>
            </div>

            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1 w-full' : 'grid-cols-2 lg:grid-cols-4 w-full max-w-5xl'}`}>

                {/* Opción 1: Subir Archivo */}
                <div
                    onClick={() => router.push('/apoyo/subir')}
                    className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow cursor-pointer flex flex-col items-center justify-center border border-gray-100 hover:border-teal-300 group"
                >
                    <div className="p-4 rounded-full bg-teal-100 group-hover:bg-teal-500 transition-colors mb-4">
                        <FaCloudUploadAlt className="text-4xl text-teal-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Subir Archivo</h3>
                    <p className="text-sm text-gray-500 text-center">
                        Cargar archivos planos (.txt, .csv) con registros del equipo.
                    </p>
                </div>

                {/* Opción 2: Consultar Historial */}
                <div
                    onClick={() => router.push('/apoyo/historial')}
                    className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow cursor-pointer flex flex-col items-center justify-center border border-gray-100 hover:border-teal-300 group"
                >
                    <div className="p-4 rounded-full bg-orange-100 group-hover:bg-orange-500 transition-colors mb-4">
                        <FaHistory className="text-4xl text-orange-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Consultar Historial</h3>
                    <p className="text-sm text-gray-500 text-center">
                        Visualizar registros históricos de la unidad de apoyo.
                    </p>
                </div>

                {/* Opción 3: Validación de Ciclos */}
                <div
                    onClick={() => router.push('/apoyo/validacion')}
                    className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow cursor-pointer flex flex-col items-center justify-center border border-gray-100 hover:border-teal-300 group"
                >
                    <div className="p-4 rounded-full bg-blue-100 group-hover:bg-blue-500 transition-colors mb-4">
                        <FaCheckCircle className="text-4xl text-blue-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Validación de Ciclos</h3>
                    <p className="text-sm text-gray-500 text-center">
                        Validar si los ciclos diarios cumplen la norma de esterilización.
                    </p>
                </div>

                {/* Opción 4: Métricas de Ciclos */}
                <div
                    onClick={() => router.push('/apoyo/metricas')}
                    className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow cursor-pointer flex flex-col items-center justify-center border border-gray-100 hover:border-teal-300 group"
                >
                    <div className="p-4 rounded-full bg-purple-100 group-hover:bg-purple-500 transition-colors mb-4">
                        <FaChartBar className="text-4xl text-purple-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Métricas</h3>
                    <p className="text-sm text-gray-500 text-center">
                        Resumen mensual de ciclos válidos e inválidos.
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
