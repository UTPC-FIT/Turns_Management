const express = require('express');
const router = express.Router();
const schedulesController = require('../controllers/schedulesController');

router.get('/', (req, res, next) => {
    if (req.query.student_id) {
        schedulesController.getStudentSchedules(req, res, next);
    } else {
        schedulesController.getAllSchedules(req, res, next);
    }
});
router.get('/current', schedulesController.getCurrentValidSchedule);
router.post('/', schedulesController.createSchedule);
router.put('/:id/status', schedulesController.updateScheduleStatus);

module.exports = router;