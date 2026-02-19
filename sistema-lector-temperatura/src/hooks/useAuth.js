// hooks/useAuth.js
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = {
      username: Cookies.get('usuario'),
      seccion: Cookies.get('seccion'),
      id: Cookies.get('id'),
      token: Cookies.get('token')
    };

    // Solo establecer como usuario si tenemos los datos básicos
    if (userData.username && userData.seccion) {
      setUser({
        username: userData.username,
        seccion: userData.seccion,
        id: userData.id,
        // Construir nombre y email basado en los datos disponibles
        nombre: userData.username, // Usamos el username como nombre
        email: `${userData.username}@adldiagnostic.cl` // Email por defecto
      });
    }
    setLoading(false);
  }, []);

  const logout = () => {
    Cookies.remove("usuario");
    Cookies.remove("seccion");
    Cookies.remove("token");
    Cookies.remove("empresa");
    Cookies.remove("id");
    Cookies.remove("userEmail");
    window.location.href = "/";
  };

  return { user, loading, logout };
};