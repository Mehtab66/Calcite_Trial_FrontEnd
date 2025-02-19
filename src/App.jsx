import { useState } from "react";
import "./App.css";
import Login from "./Components/Auth/Login";
import Register from "./Components/Auth/Register";
import { Routes, Route } from "react-router-dom";
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}

export default App;
