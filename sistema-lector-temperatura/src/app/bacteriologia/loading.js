"use client";
import React from "react";
import "../globals.css";

function Loading() {
  return (
    <div className="flex h-screen w-full bg-zinc-50">
      <div className="mx-auto mt-60 justify-center">
        <img
          src="/images/gif_v3.gif"
          className={`w-[100px]`}
        />
        <div className="mt-4 text-sm text-center text-sky-900">Cargando...</div>
      </div>
    </div>
  );
}

export default Loading;
