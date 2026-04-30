"use client";
import React from "react";
import ApoyoMetricas from "@/components/ApoyoMetricas";
import SessionExpiredModal from "@/components/SessionExpiredModal";
import useTokenVerification from "@/hooks/useTokenVerification";
import { useRouter } from "next/navigation";

export default function ApoyoMetricasPage() {
    const { sessionModalVisible, handleSessionModalOk } = useTokenVerification();
    const router = useRouter();

    const backButton = (
        <button
            onClick={() => router.push('/apoyo')}
            className="group flex items-center gap-1.5 text-slate-500 hover:text-teal-600 bg-transparent hover:bg-teal-50 px-4 py-1.5 rounded-full transition-all text-sm font-semibold tracking-wide w-fit border border-transparent hover:border-teal-100"
        >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Volver al Menú Apoyo
        </button>
    );

    return (
        <div className="flex w-full min-h-screen items-start justify-center pt-6 text-teal-900 bg-gray-50 pb-10">
            <ApoyoMetricas backButton={backButton} />
            
            <SessionExpiredModal
                isVisible={sessionModalVisible}
                onOk={handleSessionModalOk}
            />
        </div>
    );
}
