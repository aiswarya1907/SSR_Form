const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Ais@2004",
    database: "task6_authentication"
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ MySQL connection failed:", err.message);
        return;
    }

    console.log("✅ MySQL database connected successfully!");

    connection.release();
});

module.exports = db;