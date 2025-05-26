const{pool} = require('../config/db');

//Obtener horarios
const getAllSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM schedules');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
};
//Horarios por ID
const getScheduleById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM schedules WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
};

//Crear horario
const createSchedule = async (req, res) => {
    const { day, start_time, end_time, description } = req.body;

    if (!day || !start_time || !end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO schedules (day, start_time, end_time, description) VALUES (?, ?, ?, ?)',
            [day, start_time, end_time, description]
        );
        res.status(201).json({ message: 'Schedule created', id: result.insertId });
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ error: 'Failed to create schedule' });
    }
};

//actualizar horario
const updateSchedule = async (req, res) => {
    const { id } = req.params;
    const { day, start_time, end_time, description } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE schedules SET day = ?, start_time = ?, end_time = ?, description = ? WHERE id = ?',
            [day, start_time, end_time, description, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json({ message: 'Schedule updated' });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
};

//Eliminar horario
const deleteSchedule = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM schedules WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json({ message: 'Schedule deleted' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
};

module.exports = {
    getAllSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
};

