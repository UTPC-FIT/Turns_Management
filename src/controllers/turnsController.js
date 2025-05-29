const { pool } = require('../config/db');

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

exports.getAllTurns = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM turn');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching turns:', error);
        res.status(500).json({ message: 'Error retrieving turns', error: error.message });
    }
};

exports.createTurn = async (req, res) => {
    const { day, start_time, end_time, max_capacity, status, color_turn } = req.body;

    const validationErrors = validateTurnData(req.body);
    if (validationErrors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO turn (day, start_time, end_time, max_capacity, status, created_turn_at, color_turn) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
            [day, start_time, end_time, max_capacity, status, color_turn]
        );
        const newTurnId = result.insertId;

        const [newTurn] = await pool.query('SELECT * FROM turn WHERE id_turn = ?', [newTurnId]);
        res.status(201).json(newTurn[0]);
    } catch (error) {
        console.error('Error creating turn:', error);
        res.status(500).json({ message: 'Error creating turn', error: error.message });
    }
};

exports.getTurnById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM turn WHERE id_turn = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Turn not found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching turn by ID:', error);
        res.status(500).json({ message: 'Error retrieving turn', error: error.message });
    }
};

exports.updateTurn = async (req, res) => {
    const { id } = req.params;
    const { day, start_time, end_time, max_capacity, status, color_turn } = req.body;

    const validationErrors = validateTurnData(req.body, false);
    if (validationErrors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

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
    if (color_turn !== undefined) {
        queryParts.push('color_turn = ?');
        queryValues.push(color_turn);
    }

    if (queryParts.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    queryParts.push('updated_turn_at = NOW()');

    const query = `UPDATE turn SET ${queryParts.join(', ')} WHERE id_turn = ?`;
    queryValues.push(id);

    try {
        const [result] = await pool.query(query, queryValues);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Turn not found or no changes made' });
        }
        const [updatedTurn] = await pool.query('SELECT * FROM turn WHERE id_turn = ?', [id]);
        res.status(200).json(updatedTurn[0]);
    } catch (error) {
        console.error('Error updating turn:', error);
        res.status(500).json({ message: 'Error updating turn', error: error.message });
    }
};

exports.deleteTurn = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE turn SET status = ?, updated_turn_at = NOW() WHERE id_turn = ?', ['inactive', id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Turn not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting/deactivating turn:', error);
        res.status(500).json({ message: 'Error deleting/deactivating turn', error: error.message });
    }
};

exports.getStudentsAssignedToTurn = async (req, res) => {
    const { id: turnId } = req.params;

    try {
        const [turnRows] = await pool.query('SELECT id_turn FROM turn WHERE id_turn = ?', [turnId]);
        if (turnRows.length === 0) {
            return res.status(404).json({ message: 'Turn not found.' });
        }

        const [students] = await pool.query(
            'SELECT id_student, state_schedule AS status FROM schedule WHERE id_turn = ?',
            [turnId]
        );
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students assigned to turn:', error);
        res.status(500).json({ message: 'Error retrieving students assigned to turn', error: error.message });
    }
};

exports.getStudentsAssignedToTurnByDate = async (req, res) => {
    const { id: turnId } = req.params;
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ message: 'Date query parameter (YYYY-MM-DD) is required.' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD.' });
    }

    try {
        const [turnRows] = await pool.query('SELECT id_turn FROM turn WHERE id_turn = ?', [turnId]);
        if (turnRows.length === 0) {
            return res.status(404).json({ message: 'Turn not found.' });
        }

        const [students] = await pool.query(
            'SELECT id_student, state_schedule AS status FROM schedule WHERE id_turn = ? AND DATE(date_schedule) = ?',
            [turnId, date]
        );
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students assigned to turn by date:', error);
        res.status(500).json({ message: 'Error retrieving students assigned to turn by date', error: error.message });
    }
};

exports.getCurrentStudentsAssignedToTurn = async (req, res) => {
    const { id: turnId } = req.params;

    try {
        const [turnRows] = await pool.query('SELECT id_turn FROM turn WHERE id_turn = ?', [turnId]);
        if (turnRows.length === 0) {
            return res.status(404).json({ message: 'Turn not found.' });
        }

        const [students] = await pool.query(
            `SELECT id_student, state_schedule AS status
             FROM schedule
             WHERE id_turn = ? AND state_schedule = 'scheduled' AND DATE(date_schedule) = CURDATE()`,
            [turnId]
        );
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching current students assigned to turn:', error);
        res.status(500).json({ message: 'Error retrieving current students assigned to turn', error: error.message });
    }
};