const express = require("express");

const app = express();
const PORT = 3000;

// Temporary server-side storage
const users = [];

// Middleware
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Display form
app.get("/", (req, res) => {
    res.render("forms", {
        message: "",
        users
    });
});

// Handle form submission
app.post("/submit", (req, res) => {

    const { name, email, age, password, course } = req.body;

    // Server-side validation
    if (!name || !email || !age || !password || !course) {
        return res.render("forms", {
            message: "All fields are required!",
            users
        });
    }

    if (!email.includes("@")) {
        return res.render("forms", {
            message: "Please enter a valid email address!",
            users
        });
    }

    if (Number(age) < 18) {
        return res.render("forms", {
            message: "Age must be 18 or above!",
            users
        });
    }

    if (password.length < 6) {
        return res.render("forms", {
            message: "Password must contain at least 6 characters.",
            users
        });
    }

    // Store validated data temporarily
    users.push({
        name,
        email,
        age,
        course
    });

    res.render("forms", {
        message: "Form submitted successfully!",
        users
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});