const mysql = require('mysql');
require('dotenv').config();

const connection = mysql.createConnection({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (!err) {
        console.log('Connected to the database!');
    } else {
        console.log('Error connecting to the database:', err);
    }
});

module.exports = connection;
