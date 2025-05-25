const express = require('express');
const router = express.Router();
const turnsController = require('../controllers/turnsController');

// GET all turns
router.get('/', turnsController.getAllTurns);

// POST a new turn
router.post('/', turnsController.createTurn);

// GET a specific turn by ID
router.get('/:id', turnsController.getTurnById);

// PUT (update) a specific turn by ID
router.put('/:id', turnsController.updateTurn);

// DELETE (or deactivate) a specific turn by ID
router.delete('/:id', turnsController.deleteTurn);

module.exports = router;