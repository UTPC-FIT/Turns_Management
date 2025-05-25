const express = require('express');
const dotenv = require('dotenv');

dotenv.config(); 

const turnsRoutes = require('./routes/turns');
const { connectDB } = require('./config/db'); // Import connectDB

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Enable JSON body parsing

// API Routes
app.use('/api/turns', turnsRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the Turns API!');
});

// Connect to DB and then start server
async function startServer() {
    try {
        await connectDB(); // Wait for DB connection
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1); // Exit if server can't start due to DB issue
    }
}

startServer(); // Call the async function to start everything