import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../Api.config";
import { toast } from "react-toastify";

// Custom hook for form validation
const useFormValidation = () => {
  const [errors, setErrors] = useState({});

  const validate = (name, value) => {
    let error = "";
    switch (name) {
      case "email":
        if (!/\S+@\S+\.\S+/.test(value)) {
          error = "Please enter a valid email address.";
        }
        break;
      case "password":
        if (value.length < 6) {
          error = "Password must be at least 6 characters long.";
        }
        break;
      case "confirmPassword":
        if (value !== document.getElementById("password").value) {
          error = "Passwords do not match.";
        }
        break;
      default:
        break;
    }
    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
    return error;
  };

  return { errors, validate };
};

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { errors, validate } = useFormValidation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      validate("email", email) ||
      validate("password", password) ||
      validate("confirmPassword", confirmPassword)
    ) {
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      // First, check the response status to handle different scenarios
      if (response.status === 201) {
        const data = await response.json();
        console.log(data);
        toast.success("Registration successful");
        setError("");
        navigate("/login");
      } else {
        // If the response isn't ok, read the response text which might not be JSON
        const text = await response.text();
        console.log(text); // Log the response text for debugging

        if (response.status === 400 && text === "User already registered.") {
          toast.error("User Already Exists");
          setError("User already registered.");
        } else {
          // For other errors, we'll treat the text as the error message
          toast.error(
            text || "An unexpected error occurred during registration."
          );
          setError(text || "Registration failed");
        }
      }
    } catch (error) {
      // Catch any network errors or JSON parsing errors
      console.error("Error:", error);
      toast.error("Registration failed. Please try again.");
      setError(error.message || "Registration failed");
    }
  };
  return (
    <div className="flex bg-gradient-to-b from-blue-300 to-blue-100  items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-xl px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl text-center mb-4 font-bold text-gray-900">
            Create Account
          </h2>
          <p className="text-center mb-6 text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500">
              Sign in
            </Link>
          </p>

          <div className="flex  items-center mb-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4 flex">
              <input
                className="shadow appearance-none border rounded w-full mr-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                id="firstName"
                type="text"
                placeholder="Mehtab Ahmed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <input
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.email ? "border-red-500" : "focus:border-blue-500"
                }`}
                id="email"
                type="email"
                placeholder="mohamadmehtabahmed@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) => validate("email", e.target.value)}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-xs italic">{errors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <input
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.password ? "border-red-500" : "focus:border-blue-500"
                }`}
                id="password"
                type={"password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={(e) => validate("password", e.target.value)}
                required
              />

              {errors.password && (
                <p className="text-red-500 text-xs italic">{errors.password}</p>
              )}
            </div>
            <div className="mb-6">
              <input
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.confirmPassword
                    ? "border-red-500"
                    : "focus:border-blue-500"
                }`}
                id="confirmPassword"
                type={"password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={(e) => validate("confirmPassword", e.target.value)}
                required
              />

              {errors.confirmPassword && (
                <p className="text-red-500 text-xs italic">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
              >
                Sign up with email
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
