const express = require('express');
const router = express.Router();
const schedulesController = require('../controllers/schedulesController');

router.get('/', schedulesController.getAllSchedules); //traer horarios
router.get('/:id', schedulesController.getScheduleById); // horario por ID
router.post('/', schedulesController.createSchedule); // crear horario
router.put('/:id', schedulesController.updateSchedule); // actualizar horario
router.delete('/:id', schedulesController.deleteSchedule); //borrar horario


module.exports = router;
