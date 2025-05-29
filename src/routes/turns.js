const express = require('express');
const router = express.Router();
const turnsController = require('../controllers/turnsController');

router.get('/', turnsController.getAllTurns);
router.post('/', turnsController.createTurn);
router.get('/:id', turnsController.getTurnById);
router.put('/:id', turnsController.updateTurn);
router.delete('/:id', turnsController.deleteTurn);
router.get('/:id/students/current', turnsController.getCurrentStudentsAssignedToTurn);
router.get('/:id/students', (req, res, next) => {
    if (req.query.date) {
        turnsController.getStudentsAssignedToTurnByDate(req, res, next);
    } else {
        turnsController.getStudentsAssignedToTurn(req, res, next);
    }
});

module.exports = router;