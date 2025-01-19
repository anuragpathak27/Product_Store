import express from "express";
import dotenv from "dotenv";
import { connectDB } from "../backend/config/db.js";
import session from "express-session";
import passport from "passport";
import { initializePassport } from "../backend/config/passport.js";
import User from "../backend/models/User.js";
import cors from 'cors';

dotenv.config();
connectDB();

const app = express();

app.use(cors({
    origin: 'http://localhost:3000', // Replace with the frontend's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
    credentials: true, // Include credentials like cookies if needed
  }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
    session({
        secret: "your-secret-key",
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());

initializePassport(passport);

// Predefine admin accounts
const seedAdmins = async () => {
    const admins = [
        { username: "admin1", password: "adminpass1", role: "admin" },
        { username: "admin2", password: "adminpass2", role: "admin" },
        { username: "admin3", password: "adminpass3", role: "admin" },
        { username: "admin4", password: "adminpass4", role: "admin" },
        { username: "admin5", password: "adminpass5", role: "admin" },
    ];

    for (const admin of admins) {
        const existingAdmin = await User.findOne({ username: admin.username });
        if (!existingAdmin) {
            const newAdmin = new User(admin);
            await newAdmin.save();
        }
    }
};
seedAdmins();

// Routes
// Registration route (Only for regular users)
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = new User({ username, password, role: "user" });
        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Login route
app.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        req.login(user, (loginErr) => {
            if (loginErr) return res.status(500).json({ message: loginErr.message });
            const redirectUrl = user.role === "admin" ? "/admin" : "/user";
            return res.status(200).json({ message: "Logged in successfully", redirect: redirectUrl });
        });
    })(req, res, next);
});

// Logout route
app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ message: "Error logging out" });
        res.status(200).json({ message: "Logged out successfully" });
    });
});

// Middleware to ensure authentication
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Unauthorized" });
};

// Middleware to restrict access to a single route
const restrictAccess = (allowedRoute) => (req, res, next) => {
    if (req.originalUrl === allowedRoute) {
        return next();
    }
    res.status(403).json({ message: "Forbidden: You cannot access this route" });
};

// Admin route
app.get("/admin", ensureAuthenticated, restrictAccess("/admin"), (req, res) => {
    if (req.user.role === "admin") {
        res.status(200).json({ message: "Welcome to the admin panel" });
    } else {
        res.status(403).json({ message: "Forbidden: Only admins can access this route" });
    }
});

// User route
app.get("/user", ensureAuthenticated, restrictAccess("/user"), (req, res) => {
    if (req.user.role === "user") {
        res.status(200).json({ message: `Welcome, ${req.user.username}` });
    } else {
        res.status(403).json({ message: "Forbidden: Only users can access this route" });
    }
});

// Default route for invalid paths
app.all("*", (req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.listen(5000, () => {
    console.log("Server started on http://localhost:5000");
});
