const express = require('express'); // 1. Import Express
const cors = require('cors'); // 2. Import CORS for cross-origin requests
const connection = require('./connection'); // 3. Import database connection
const userRoute = require('./routes/user'); // 4. Import user routes
const projectRoute = require('./routes/project'); // 5. Import project routes
const calendarRoute = require('./routes/calendar'); // 6. Import calendar routes
const path = require('path'); // 7. Import path module for handling file paths
require('dotenv').config(); // 8. Load environment variables
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');


if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const app = express(); // Initialize Express app


app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/user',userRoute);//file creation code
app.use('/project',projectRoute);
app.use('/calendar',calendarRoute);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));





module.exports = app;