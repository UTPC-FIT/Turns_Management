const { pool } = require('../config/db');

const isValidScheduleState = (state) => ['scheduled', 'attended', 'cancelled'].includes(state.toLowerCase());

const parseDate = (dateString) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return null;
        }
        return date;
    } catch (e) {
        return null;
    }
};

const calculateNextWeekdayDateTime = (dayOfWeekString, fromDate, turnStartTime) => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const targetDayIndex = days.indexOf(dayOfWeekString.toUpperCase());

    if (targetDayIndex === -1) {
        throw new Error('Invalid day of week string provided for turn.day.');
    }

    const now = new Date(fromDate);
    const [startHour, startMinute, startSecond] = turnStartTime.split(':').map(Number);

    let nextDate = new Date(now);
    nextDate.setHours(startHour, startMinute, startSecond || 0, 0);
    let daysToAdd = targetDayIndex - now.getDay();

    if (daysToAdd === 0 && nextDate.getTime() <= now.getTime()) {
        daysToAdd += 7;
    } else if (daysToAdd < 0) {
        daysToAdd += 7;
    }

    nextDate = new Date(now); 
    nextDate.setDate(now.getDate() + daysToAdd);
    nextDate.setHours(startHour, startMinute, startSecond || 0, 0);

    return nextDate;
};

exports.getAllSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM schedule');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching all schedules:', error);
        res.status(500).json({ message: 'Error retrieving all schedules', error: error.message });
    }
};

exports.getStudentSchedules = async (req, res) => {
    const { student_id, status } = req.query;

    if (!student_id) {
        return res.status(400).json({ message: 'student_id query parameter is required.' });
    }

    let query = 'SELECT * FROM schedule WHERE id_student = ?';
    const params = [student_id];

    if (status) {
        if (!isValidScheduleState(status)) {
            return res.status(400).json({ message: 'Invalid status provided. Must be scheduled, attended, or cancelled.' });
        }
        query += ' AND state_schedule = ?';
        params.push(status.toLowerCase());
    }

    try {
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching student schedules:', error);
        res.status(500).json({ message: 'Error retrieving student schedules', error: error.message });
    }
};

exports.getCurrentValidSchedule = async (req, res) => {
    const { student_id } = req.query;

    if (!student_id) {
        return res.status(400).json({ message: 'student_id query parameter is required.' });
    }

    try {
        const [schedules] = await pool.query(
            `SELECT
                s.*,
                t.day AS turn_day,
                t.start_time AS turn_start_time,
                t.end_time AS turn_end_time
            FROM schedule s
            JOIN turn t ON s.id_turn = t.id_turn
            WHERE s.id_student = ? AND s.state_schedule = 'scheduled'
            ORDER BY s.date_schedule ASC, t.start_time ASC
            `, [student_id]
        );

        if (schedules.length === 0) {
            return res.status(404).json({ message: 'No scheduled turns found for this student.' });
        }

        const now = new Date();

        const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

        for (const schedule of schedules) {
            const scheduleDateTime = parseDate(schedule.date_schedule);
            if (!scheduleDateTime) {
                console.warn(`Invalid date_schedule for schedule ID: ${schedule.id_schedule}`);
                continue;
            }

            const [turnHour, turnMinute, turnSecond] = schedule.turn_start_time.split(':').map(Number);
            const fullScheduleDateTime = new Date(scheduleDateTime);
            fullScheduleDateTime.setHours(turnHour, turnMinute, turnSecond || 0, 0);

            if (fullScheduleDateTime.getTime() >= now.getTime()) {
                const turnDayIndex = daysOfWeek.indexOf(schedule.turn_day.toUpperCase());
                if (fullScheduleDateTime.getDay() === turnDayIndex) {
                     res.status(200).json(schedule);
                     return;
                }
            }
        }
        res.status(404).json({ message: 'No current or upcoming valid scheduled turns found for this student.' });

    } catch (error) {
        console.error('Error fetching current valid schedule:', error);
        res.status(500).json({ message: 'Error retrieving current valid schedule', error: error.message });
    }
};

exports.updateScheduleStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Schedule ID is required.' });
    }
    if (!status || !['attended', 'cancelled'].includes(status.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid status provided. Must be "attended" or "cancelled".' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE schedule SET state_schedule = ?, updated_schedule_time = NOW() WHERE id_schedule = ?',
            [status.toLowerCase(), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Schedule not found or no changes made.' });
        }

        const [updatedSchedule] = await pool.query('SELECT * FROM schedule WHERE id_schedule = ?', [id]);
        res.status(200).json(updatedSchedule[0]);
    } catch (error) {
        console.error('Error updating schedule status:', error);
        res.status(500).json({ message: 'Error updating schedule status', error: error.message });
    }
};

exports.createSchedule = async (req, res) => {
    const { turn_id, student_id } = req.body;

    if (!turn_id || !student_id) {
        return res.status(400).json({ message: 'turn_id and student_id are required in the request body.' });
    }

    try {
        const [turns] = await pool.query('SELECT day, start_time FROM turn WHERE id_turn = ?', [turn_id]);
        if (turns.length === 0) {
            return res.status(404).json({ message: 'Turn not found with the provided turn_id.' });
        }
        const { day: turnDay, start_time: turnStartTime } = turns[0];

        const calculatedDateTime = calculateNextWeekdayDateTime(turnDay, new Date(), turnStartTime);
        const date_schedule = calculatedDateTime.toISOString().slice(0, 19).replace('T', ' ');

        const state_schedule = 'scheduled';

        const [result] = await pool.query(
            'INSERT INTO schedule (date_schedule, id_student, id_turn, state_schedule, created_schedule_at) VALUES (?, ?, ?, ?, NOW())',
            [date_schedule, student_id, turn_id, state_schedule]
        );

        const newScheduleId = result.insertId;
        const [newSchedule] = await pool.query('SELECT * FROM schedule WHERE id_schedule = ?', [newScheduleId]);
        res.status(201).json(newSchedule[0]);

    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ message: 'Error creating schedule', error: error.message });
    }
};