import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import MainPage from "./components/MainPage";
import { ToastContainer } from "react-toastify";


const App = () => {
  return (
    <Router>
      <div>
        <header className="bg-primary text-white p-3">
          <h1 className="text-center">Image Generation App</h1>
        </header>
        <ToastContainer autoClose={3000} />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/main" element={<MainPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
