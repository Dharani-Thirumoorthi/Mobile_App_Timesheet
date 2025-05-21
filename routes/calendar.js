const express = require('express');
const connection = require('../connection');
const router = express.Router();


// --------------------------POST--------------------------------
router.post('/insertEvent', (req, res) => {
    const { Event_Name, Event_Date, Event_Type, Event_EveryYear } = req.body;
    
    if (!Event_Name || !Event_Date || !Event_Type || !Event_EveryYear) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const query = `INSERT INTO calendar (Event_Name, Event_Date, Event_Type, Event_EveryYear) VALUES (?, ?, ?, ?)`;
    
    connection.query(query, [Event_Name, Event_Date, Event_Type, Event_EveryYear], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error inserting event', error: err });
        }
        res.status(200).json({ message: 'Event inserted successfully', eventId: result.insertId });
    });
});


// ---------------------------GET-----------------------------------
router.get('/getEvents', (req, res) => {
    const query = `SELECT * FROM calendar`;

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching events', error: err });
        }
        res.status(200).json({ events: results });
    });
});


// -----------------------------DELETE--------------------------------

router.delete('/deleteEvent/:eventName', (req, res) => {
    const eventName = req.params.eventName;

    if (!eventName) {
        return res.status(400).json({ message: 'Invalid event name' });
    }

    const query = `DELETE FROM calendar WHERE Event_Name = ?`;

    connection.query(query, [eventName], (err, result) => {
        if (err) {
            console.error('Database Error:', err); // Log the exact error
            return res.status(500).json({ message: 'Error deleting event', error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json({ message: 'Event deleted successfully' });
    });
});


// ----------------------------UPDATE----------------------------------


router.patch('/updateEvent/:eventName', (req, res) => {
    const eventName = decodeURIComponent(req.params.eventName); // Decode event name from URL
    const updates = req.body; // Get only the fields that need to be updated

    if (!eventName) {
        return res.status(400).json({ message: 'Invalid event name' });
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update' });
    }

    const fields = Object.keys(updates).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(eventName); // Add event name as the last parameter

    const query = `UPDATE calendar SET ${fields} WHERE Event_Name = ?`;

    connection.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating event', error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json({ message: 'Event updated successfully' });
    });
});

// ------------
router.get('/getCalendarEvents', (req, res) => { 
    const query = `SELECT Event_Name, Event_Date FROM calendar`;

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching events', error: err });
        }
        res.status(200).json({ events: results });
    });
});

router.get('/calendar/getEvents', async (req, res) => {
    const { month } = req.query; // Get month in "YYYY-MM" format

    if (!month) {
        return res.status(400).json({ error: 'Month parameter is required' });
    }

    try {
        // Ensure Event_Date is stored in DATE or DATETIME format
        const [rows] = await connection.execute(
            `SELECT * FROM calendar WHERE DATE_FORMAT(Event_Date, '%Y-%m') = ?`,
            [month]
        );

        if (rows.length === 0) {
            return res.status(200).json({ events: [] }); // Return empty array when no events exist
        }

        res.json({ events: rows }); // Return filtered events
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;