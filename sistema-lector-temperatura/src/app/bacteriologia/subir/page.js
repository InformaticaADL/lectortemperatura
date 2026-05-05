"use client";
import "../../globals.css";
import React, { useState, useEffect } from "react";
import useIsMobile from "@/hooks/useIsMobile";
import Cookies from "js-cookie";
import SessionExpiredModal from "@/components/SessionExpiredModal";
import { useRouter } from "next/navigation";
import "react-toastify/dist/ReactToastify.css";
import useTokenVerification from "@/hooks/useTokenVerification";
import IncubadoraUpload from "@/components/IncubadoraUpload";


export default function PageSubir() {
    const isMobile = useIsMobile();
    const { sessionModalVisible, handleSessionModalOk } = useTokenVerification();
    const router = useRouter();

    useEffect(() => {
        const seccion = Cookies.get("seccion");
        if (seccion !== "INF") {
            router.push("/menu");
        }
    }, [router]);

    return (
        <div className="flex w-full min-h-screen items-start text-sky-900 flex-col p-0">
            <div className="w-full flex justify-center mt-8 px-4 md:px-8">
                <IncubadoraUpload 
                    allowedIncubators={['INC.12 LAB.BAM.PM']}
                    backButton={
                    <button
                        onClick={() => router.push('/bacteriologia')}
                        className="group flex items-center gap-1.5 text-slate-500 hover:text-sky-600 bg-transparent hover:bg-sky-50 px-3 py-1.5 rounded-full transition-all text-sm font-semibold tracking-wide w-fit border border-transparent hover:border-sky-100 -ml-3"
                    >
                        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Volver al Menú
                    </button>
                } />
            </div>

            <SessionExpiredModal
                isVisible={sessionModalVisible}
                onOk={handleSessionModalOk}
            />
        </div>
    );
}
