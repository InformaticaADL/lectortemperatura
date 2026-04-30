"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginLayout from "./layout";
import Cookies from "js-cookie";
import api from "@/api/apiConfig";
import useIsMobile from "@/hooks/useIsMobile";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

const Login = () => {
  const [nombre_usuario, setUsername] = useState("");
  const [contraseña, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const isMobile = useIsMobile();
  const [verContraseña, setVerContraseña] = useState(false);

  useEffect(() => {
    document.title = "Inicio de sesión - ADL";
  }, []);

  // Función de validación formulario
  const validateForm = () => {
    if (!nombre_usuario) {
      setError("El nombre de usuario es obligatorio");
      return false;
    }
    if (!contraseña) {
      setError("La contraseña es obligatoria");
      return false;
    }
    setError("");
    return true;
  };

  // Procesar login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return; 
    }

    try {
      const response = await api.post("/usuario/login/", {
        nombre_usuario: nombre_usuario,
        contraseña: contraseña,
      });

      if (response.status === 200) {
        const data = response.data;
        
        // Verificamos primero si es INF o APO antes de guardar cookies y redireccionar
        if (data.seccion === "INF" || data.seccion === "APO") {
            Cookies.set("token", data.token);
            Cookies.set("usuario", data.username);
            Cookies.set("id", data.id_usuario);
            Cookies.set("seccion", data.seccion);
            Cookies.set('userEmail', data.email);
            
            router.push("/menu");
        } else {
            // Si el usuario existe pero no es de la sección INF ni APO
            setError("Acceso denegado: No pertenece a la sección INF o APO.");
        }

      } else {
        setError("Datos inválidos");
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data);
      } else {
        setError("Ocurrió un problema, inténtelo nuevamente.");
      }
      console.error("Error durante el login:", error);
    }
  };

  return (
  <div className="relative flex flex-col items-center justify-center h-screen">
    {/* Contenedor principal en pantalla completa con diseño responsivo */}
    <div className="w-screen h-screen flex flex-col md:flex-row md:items-center md:justify-center gap-6 py-6 pt-24 md:pt-0">
      
      {/* Lado izquierdo: imagen con texto */}
      <div className="w-full md:w-1/2 flex items-center justify-center relative">
        <h1
          className="
            absolute
            tracking-wide text-3xl md:text-4xl font-semibold drop-shadow-lg hidden md:block md:bottom-40 xl:bottom-52 text-sky-900
            text-center w-full px-4
          "
        >
          Bienvenido!
        </h1>

        <img
          src="/images/logo_adl.png"
          alt="Imagen de bienvenida"
          className="scale-110 md:scale-125 object-contain max-w-[90%] max-h-[90%]"
        />
      </div>

      {/* Lado derecho: formulario de login */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 md:px-0 pt-10 md:pt-0">
        <form className="w-[500px]" onSubmit={handleLogin}>
          <h2 className="text-xl font-bold text-center text-sky-800 mb-4">
            INICIO DE SESIÓN
          </h2>
          <h3 className="text-lg font-bold text-center text-sky-800 mb-4">
            REGISTRO DE TEMPERATURA
          </h3>

          <p
            className={`text-red-500 text-sm my-1 ${error ? "visible" : "invisible"}`}
            style={{ minHeight: "10px" }}
          >
            {error || "\u00A0"}
          </p>

          {/* Campo Usuario */}
          <div className="mb-8">
            <label
              className="block text-sky-700 text-md font-semibold mb-3"
              htmlFor="nombre_usuario"
            >
              Nombre de usuario
            </label>
            <input
              id="nombre_usuario"
              type="text"
              value={nombre_usuario}
              placeholder="Ingrese usuario"
              onChange={(e) => setUsername(e.target.value)}
              className={`shadow focus:border-orange-400 appearance-none border rounded w-full py-2 px-3 text-sky-700 leading-tight focus:outline-none focus:shadow-outline ${isMobile ? "text-base" : "text-md"}`}
            />
          </div>

          {/* Campo Contraseña */}
          <div className="mb-8">
            <label
              className="block text-sky-700 text-md font-semibold mb-3"
              htmlFor="contraseña"
            >
              Contraseña
            </label>
            {/* Contenedor relativo para el input y el botón del ojo */}
            <div className="relative">
              <input
                id="contraseña"
                type={verContraseña ? "text" : "password"}
                value={contraseña}
                placeholder="Ingrese contraseña"
                onChange={(e) => setPassword(e.target.value)}
                className={`shadow focus:border-orange-400 appearance-none border rounded w-full py-2 px-3 text-sky-700 leading-tight focus:outline-none focus:shadow-outline ${isMobile ? "text-base" : "text-md"}`}
              />
              <button
                type="button"
                onClick={() => setVerContraseña(!verContraseña)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sky-700 focus:outline-none"
                tabIndex={-1}
              >
                {verContraseña ? (
                  <AiFillEyeInvisible className="w-7 h-7" />
                ) : (
                  <AiFillEye className="w-7 h-7" />
                )}
              </button>
            </div>
          </div>

          {/* Botón Ingresar */}
          <div className="flex justify-center mt-7">
            <button
              type="submit"
              className="bg-sky-700 hover:bg-sky-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Acceder
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  );
};

Login.getLayout = function getLayout(page) {
  return <LoginLayout>{page}</LoginLayout>;
};

export default Login;