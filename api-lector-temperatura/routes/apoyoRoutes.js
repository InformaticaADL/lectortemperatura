const express = require('express');
const router = express.Router();

const protectRouteAPO = require('../middlewares/protectRouteAPO');
const apoyoController = require('../controllers/apoyoController');

router.post('/consolidar', protectRouteAPO, apoyoController.consolidar);
router.get('/list', protectRouteAPO, apoyoController.getEquipos);
router.get('/history/:equipo_id', protectRouteAPO, apoyoController.getApoyoHistory);
router.get('/years/:equipo_id', protectRouteAPO, apoyoController.getAvailableYears);
router.get('/range/:equipo_id', protectRouteAPO, apoyoController.getApoyoDateRange);
router.get('/dates/:equipo_id', protectRouteAPO, apoyoController.getApoyoDates);
router.get('/metrics/:equipo_id', protectRouteAPO, apoyoController.getCycleMetrics);

module.exports = router;
