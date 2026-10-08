const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const NodeCache = require("node-cache");
const db = require("./db");

const app = express();
const PORT = 3000;
const countryCache = new NodeCache({
    stdTTL: 300
});

// ========================================
// EJS CONFIGURATION
// ========================================

app.set("view engine", "ejs");


// ========================================
// MIDDLEWARE
// ========================================

// For HTML form data
app.use(bodyParser.urlencoded({ extended: true }));

// For JSON data sent by Fetch API
app.use(express.json());

app.use(session({
    secret: "task6_secret_key",
    resave: false,
    saveUninitialized: false
}));
function requireAuth(req, res, next) {

    if (!req.session.userId) {

        // API requests should receive JSON
        if (req.path.startsWith("/api/")) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        // Normal pages go to login
        return res.redirect("/login");
    }

    next();
}
// Serve CSS and JavaScript
app.use(express.static("public"));
// ===============================
// TASK 8 - CUSTOM MIDDLEWARE
// ===============================

app.use((req, res, next) => {
    const startTime = Date.now();

    res.on("finish", () => {
        const responseTime = Date.now() - startTime;

        console.log(
            `📝 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`
        );
    });

    next();
});
// ========================================
// TASK 7 - API RATE LIMITER
// ========================================

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 10,            // maximum 10 requests
    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        message: "Too many requests. Please try again later."
    }
});

// ========================================
// TEMPORARY STUDENT DATABASE
// ========================================

// This is temporary in-memory storage.
// Data will reset when the server restarts.




// ========================================
// HOME PAGE
// ========================================

app.get("/", (req, res) => {

    res.render("index");

});
app.get("/register", (req, res) => {
    res.render("register");
});
app.post("/register", async (req, res) => {

    const { name, email, password } = req.body;

    try {

        // Check if email already exists
        const [existingUsers] = await db.promise().query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.send("Email already registered. Please use another email.");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user in MySQL
        await db.promise().query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        res.send(`
            <h2>Registration successful!</h2>
            <p>Your account has been created.</p>
            <a href="/login">Go to Login</a>
        `);

    } catch (error) {

        console.error("Registration error:", error);

        res.status(500).send("Registration failed.");
    }
});
app.get("/login", (req, res) => {
    res.render("login");
});
app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    try {

        // Find user by email
        const [users] = await db.promise().query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        // User not found
        if (users.length === 0) {
            return res.send("Invalid email or password.");
        }

        const user = users[0];

        // Compare entered password with hashed password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );
if (!passwordMatch) {
    return res.send("Invalid email or password.");
}

// Store logged-in user in session
req.session.userId = user.id;
req.session.userName = user.name;

// Login successful
res.send(`
    <h2>Login successful!</h2>
    <p>Welcome, ${user.name}!</p>
    <a href="/students">Go to Student Dashboard</a>
`);
    } catch (error) {

        console.error("Login error:", error);

        res.status(500).send("Login failed.");
    }
});

// Student API Dashboard

app.get("/students", requireAuth, (req, res) => {

    res.render("students");

});

// ========================================
// EXISTING FORM SUBMISSION
// ========================================

app.post("/submit", (req, res) => {

    const name = req.body.name;
    const email = req.body.email;

    res.render("result", {
        username: name,
        useremail: email
    });

});
// ========================================
// TASK 6 - MYSQL AUTHENTICATED REST API
// ========================================


// ========================================
// GET ALL STUDENTS
// GET /api/students
// ========================================

app.get("/api/students", requireAuth, async (req, res) => {

    try {

        const [students] = await db.promise().query(
            `SELECT *
             FROM students
             WHERE user_id = ?
             ORDER BY id DESC`,
            [req.session.userId]
        );

        res.json(students);

    } catch (error) {

        console.error("Get students error:", error);

        res.status(500).json({
            message: "Failed to fetch students"
        });
    }
});


// ========================================
// GET ONE STUDENT
// GET /api/students/:id
// ========================================

app.get("/api/students/:id", requireAuth, async (req, res) => {

    try {

        const [students] = await db.promise().query(
            `SELECT *
             FROM students
             WHERE id = ?
             AND user_id = ?`,
            [
                req.params.id,
                req.session.userId
            ]
        );


        if (students.length === 0) {

            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json(students[0]);

   } catch (error) {
    console.error("Get student error:", error);

    res.status(500).json({
        message: "Failed to fetch student"
    });
}
});


// ========================================
// CREATE STUDENT
// POST /api/students
// ========================================

app.post("/api/students", requireAuth, async (req, res) => {

    const {
        name,
        email,
        phone,
        skills,
        about
    } = req.body;

    if (!name || !email) {

        return res.status(400).json({
            message: "Name and email are required"
        });
    }

    try {

        const [result] = await db.promise().query(
            `INSERT INTO students
            (user_id, name, email, phone, skills, about)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.session.userId,
                name,
                email,
                phone || "",
                skills || "",
                about || ""
            ]
        );

        const [newStudent] = await db.promise().query(
            `SELECT *
             FROM students
             WHERE id = ?
             AND user_id = ?`,
            [
                result.insertId,
                req.session.userId
            ]
        );

        res.status(201).json({

            message: "Student created successfully",

            student: newStudent[0]

        });

    } catch (error) {

        console.error("Create student error:", error);

        res.status(500).json({
            message: "Failed to create student"
        });
    }
});


// ========================================
// UPDATE STUDENT
// PUT /api/students/:id
// ========================================

app.put("/api/students/:id", requireAuth, async (req, res) => {

    const {
        name,
        email,
        phone,
        skills,
        about
    } = req.body;

    if (!name || !email) {

        return res.status(400).json({
            message: "Name and email are required"
        });
    }

    try {

        const [result] = await db.promise().query(
            `UPDATE students
             SET name = ?,
                 email = ?,
                 phone = ?,
                 skills = ?,
                 about = ?
             WHERE id = ?
             AND user_id = ?`,
            [
                name,
                email,
                phone || "",
                skills || "",
                about || "",
                req.params.id,
                req.session.userId
            ]
        );

        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Student not found"
            });
        }

        const [updatedStudent] = await db.promise().query(
            `SELECT *
             FROM students
             WHERE id = ?
             AND user_id = ?`,
            [
                req.params.id,
                req.session.userId
            ]
        );

        res.json({

            message: "Student updated successfully",

            student: updatedStudent[0]

        });

    } catch (error) {

        console.error("Update student error:", error);

        res.status(500).json({
            message: "Failed to update student"
        });
    }
});


// ========================================
// DELETE STUDENT
// DELETE /api/students/:id
// ========================================

app.delete("/api/students/:id", requireAuth, async (req, res) => {

    try {

        const [students] = await db.promise().query(
            `SELECT *
             FROM students
             WHERE id = ?
             AND user_id = ?`,
            [
                req.params.id,
                req.session.userId
            ]
        );

        if (students.length === 0) {

            return res.status(404).json({
                message: "Student not found"
            });
        }

        await db.promise().query(
            `DELETE FROM students
             WHERE id = ?
             AND user_id = ?`,
            [
                req.params.id,
                req.session.userId
            ]
        );

        res.json({

            message: "Student deleted successfully",

            student: students[0]

        });

    } catch (error) {

        console.error("Delete student error:", error);

        res.status(500).json({
            message: "Failed to delete student"
        });
    }
});
// ========================================
// LOGOUT
// ========================================

app.get("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            console.error("Logout error:", err);

            return res.status(500).send("Logout failed.");
        }

        res.redirect("/login");
    });
});

// ========================================
// START SERVER
// ========================================
// ============================================
// TASK 7 - EXTERNAL COUNTRY API
// ============================================

app.get(
    "/api/country/:name",
    requireAuth,
    apiLimiter,
    async (req, res) => {
        try {
            const countryName = req.params.name;
            const cacheKey = countryName.toLowerCase();

            // 1. Check cache first
            const cachedCountry = countryCache.get(cacheKey);

            if (cachedCountry) {
                console.log("⚡ Returning country data from cache");
                return res.json(cachedCountry);
            }

            // 2. Fetch from external API if not cached
            const response = await axios.get(
                `https://api.restcountries.com/countries/v5/names.common/${encodeURIComponent(countryName)}`,
                {
                    headers: {
                        Authorization: "Bearer rc_live_demo"
                    }
                }
            );

            const country = response.data.data.objects[0];

            if (!country) {
                return res.status(404).json({
                    message: "Country not found"
                });
            }

            // 3. Prepare country data
            const countryData = {
                name: country.names?.common || "N/A",

                capital:
                    country.capitals?.[0]?.name || "N/A",

                region:
                    country.region || "N/A",

                population:
                    country.population || "N/A",

                currency:
                    country.currencies?.[0]?.name || "N/A",

                flagUrl:
                    country.flag?.url_png || ""
            };

            // 4. Store in cache
            countryCache.set(cacheKey, countryData);

            console.log("💾 Country data saved to cache");

            // 5. Send response
            res.json(countryData);

        } catch (error) {
            console.error("External API error:", error.message);

            if (error.response) {
                console.error("Status:", error.response.status);
                console.error("Data:", error.response.data);
            }

            res.status(500).json({
                message: "Unable to fetch country information."
            });
        }
    }
);
// ========================================
// TASK 7 - OAUTH INFORMATION
// ========================================

app.get("/oauth", (req, res) => {
    res.render("oauth");
});
// ========================================
// TASK 7 - EXTERNAL API DASHBOARD
// ========================================

app.get("/external-api", (req, res) => {
    res.render("external-api");
});
// ===============================
// TASK 8 - BACKGROUND JOB
// ===============================

cron.schedule("* * * * *", () => {
    console.log("⏰ Background job is running...");

    const keys = countryCache.keys();

    console.log(`📦 Cached countries: ${keys.length}`);

    if (keys.length > 0) {
        console.log("🌍 Cached:", keys.join(", "));
    }
});
app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});