const { pool } = require('../config/db');

// Helper function to validate turn data
const validateTurnData = (data, isNew = true) => {
    const errors = [];
    if (isNew) {
        if (!data.day) errors.push('Day is required.');
        if (!data.start_time) errors.push('Start time is required.');
        if (!data.end_time) errors.push('End time is required.');
        if (data.max_capacity === undefined) errors.push('Max capacity is required.');
        if (!data.status) errors.push('Status is required.');
    }

    if (data.max_capacity !== undefined && (typeof data.max_capacity !== 'number' || data.max_capacity <= 0)) {
        errors.push('Max capacity must be a positive number.');
    }
    if (data.day && !['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].includes(data.day.toUpperCase())) {
        errors.push('Invalid day. Must be one of MONDAY, TUESDAY, etc.');
    }
    if (data.status && !['active', 'inactive'].includes(data.status.toLowerCase())) {
        errors.push('Invalid status. Must be "active" or "inactive".');
    }
    // Basic time format check (HH:MM) - you might want a more robust regex
    const timeRegex = /^(?:2[0-3]|[01]?[0-9]):(?:[0-5]?[0-9])$/;
    if (data.start_time && !timeRegex.test(data.start_time)) {
        errors.push('Start time must be in HH:MM format.');
    }
    if (data.end_time && !timeRegex.test(data.end_time)) {
        errors.push('End time must be in HH:MM format.');
    }

    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
        errors.push('End time must be after start time.');
    }

    return errors;
};


// GET /api/turns
exports.getAllTurns = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM turn');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching turns:', error);
        res.status(500).json({ message: 'Error retrieving turns', error: error.message });
    }
};

// POST /api/turns
exports.createTurn = async (req, res) => {
    const { day, start_time, end_time, max_capacity, status, color_turn } = req.body; // Added color_turn based on DB schema [cite: 3]

    const validationErrors = validateTurnData(req.body);
    if (validationErrors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO turn (day, start_time, end_time, max_capacity, status, created_turn_at, color_turn) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
            [day, start_time, end_time, max_capacity, status, color_turn] // Pass color_turn [cite: 3]
        );
        const newTurnId = result.insertId;

        const [newTurn] = await pool.query('SELECT * FROM turn WHERE id_turn = ?', [newTurnId]); // id_turn based on schema [cite: 2]
        res.status(201).json(newTurn[0]);
    } catch (error) {
        console.error('Error creating turn:', error);
        res.status(500).json({ message: 'Error creating turn', error: error.message });
    }
};

// GET /api/turns/:id
exports.getTurnById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM turn WHERE id_turn = ?', [id]); // id_turn based on schema [cite: 2]
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Turn not found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching turn by ID:', error);
        res.status(500).json({ message: 'Error retrieving turn', error: error.message });
    }
};

// PUT /api/turns/:id
exports.updateTurn = async (req, res) => {
    const { id } = req.params;
    const { day, start_time, end_time, max_capacity, status, color_turn } = req.body; // Added color_turn [cite: 3]

    const validationErrors = validateTurnData(req.body, false); // isNew = false for updates
    if (validationErrors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    // Build update query dynamically to only update provided fields
    let queryParts = [];
    const queryValues = [];

    if (day !== undefined) {
        queryParts.push('day = ?');
        queryValues.push(day);
    }
    if (start_time !== undefined) {
        queryParts.push('start_time = ?');
        queryValues.push(start_time);
    }
    if (end_time !== undefined) {
        queryParts.push('end_time = ?');
        queryValues.push(end_time);
    }
    if (max_capacity !== undefined) {
        queryParts.push('max_capacity = ?');
        queryValues.push(max_capacity);
    }
    if (status !== undefined) {
        queryParts.push('status = ?');
        queryValues.push(status);
    }
    if (color_turn !== undefined) { // Add color_turn to update [cite: 3]
        queryParts.push('color_turn = ?');
        queryValues.push(color_turn);
    }

    if (queryParts.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    queryParts.push('updated_turn_at = NOW()'); // Update timestamp [cite: 2]

    const query = `UPDATE turn SET ${queryParts.join(', ')} WHERE id_turn = ?`; // id_turn based on schema [cite: 2]
    queryValues.push(id);

    try {
        const [result] = await pool.query(query, queryValues);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Turn not found or no changes made' });
        }
        const [updatedTurn] = await pool.query('SELECT * FROM turn WHERE id_turn = ?', [id]); // id_turn based on schema [cite: 2]
        res.status(200).json(updatedTurn[0]);
    } catch (error) {
        console.error('Error updating turn:', error);
        res.status(500).json({ message: 'Error updating turn', error: error.message });
    }
};

// DELETE /api/turns/:id (or deactivate)
exports.deleteTurn = async (req, res) => {
    const { id } = req.params;
    try {
        // Option 1: Hard delete (be careful with this in production)
        // const [result] = await pool.query('DELETE FROM turn WHERE id_turn = ?', [id]);

        // Option 2: Soft delete (recommended for most applications) by setting status to 'inactive'
        const [result] = await pool.query('UPDATE turn SET status = ?, updated_turn_at = NOW() WHERE id_turn = ?', ['inactive', id]); // 'inactive' from ENUM in schema [cite: 2]


        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Turn not found' });
        }
        res.status(204).send(); // No content for successful deletion/deactivation
    } catch (error) {
        console.error('Error deleting/deactivating turn:', error);
        res.status(500).json({ message: 'Error deleting/deactivating turn', error: error.message });
    }
};