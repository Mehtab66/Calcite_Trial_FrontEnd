import { useState } from "react";
import "./App.css";
import Login from "./Components/Auth/Login";
import Register from "./Components/Auth/Register";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Components/Dashboards/Dashboard";
import AdminDashboard from "./Components/Dashboards/AdminDashboard";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/adminDashboard" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

export default App;
