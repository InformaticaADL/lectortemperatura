const jwt = require('jsonwebtoken');
require('dotenv').config();

const protectRouteAPO = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // --- DEBUG LOGS ---
    console.log("🔍 Middleware APO/INF - Header recibido:", authHeader);
    
    if (!authHeader) {
        return res.status(401).json({ 
            success: false,
            message: 'Es necesario un token de acceso.' 
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ 
            success: false,
            message: 'Formato de token incorrecto. Use: Bearer <token>' 
        });
    }

    const token = parts[1];

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Token no proporcionado.' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        
        console.log("✅ Token verificado. Usuario:", decoded.nombre_usuario, "Sección:", decoded.seccion);

        // Permitir ambas secciones
        if (decoded.seccion !== 'INF' && decoded.seccion !== 'APO') {
            return res.status(403).json({ 
                success: false,
                message: 'Acceso denegado. No tienes permisos para acceder a recursos de Apoyo o INF.' 
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.log('❌ Error al verificar token:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expirado.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Token inválido.' });
        }
        res.status(500).json({ success: false, message: 'Error interno al validar token.' });
    }
};

module.exports = protectRouteAPO;
