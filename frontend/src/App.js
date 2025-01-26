import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";

const App = () => {
    return (
        <Router>
            <Routes>
                {/* Default route */}
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin" element={<AdminDashboard />} />
                {/* <Route path="/user" element={<UserDashboard />} /> */}
            </Routes>
        </Router>
    );
};

export default App;
