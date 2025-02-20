import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../Api.config";
import { toast } from "react-toastify";
import { useAuth } from "../../Context/AuthContext"; // Import useAuth

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { StoreTokenAndRole } = useAuth(); // Use useAuth

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const data = await response.json();
      console.log(data);
      if (data.token) {
        StoreTokenAndRole(data.token, data.user);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else if (response.status === 400) {
        toast.error("Invalid email or password");
      } else {
        toast.error(
          data.message || "Login failed. Please check your credentials."
        );
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message || "An error occurred. Please try again.");
      setError(error.message || "Login failed");
    }
  };

  return (
    <div className="flex bg-gradient-to-b from-blue-300 to-blue-100 flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl px-8 pt-6 pb-8 mb-4"
        >
          <h2 className="text-2xl text-center mb-4 font-bold text-gray-900">
            Login
          </h2>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="mohamadmehtaahmed@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Sign In
            </button>
            <Link
              to="/register"
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
            >
              Don't have an account? Register
            </Link>
          </div>
          <p className="text-center mt-6 text-gray-500 text-xs">
            ©2023 Calcite Technologies. All rights reserved.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
