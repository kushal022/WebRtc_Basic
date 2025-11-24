import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { SERVER_URL } from "../config";

const Register = () => {
  const { login , setUsername } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const res = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    console.log('Register: ',data)
    if (data.success === false) return setError(data.message);
    navigate("/login");
    login(data.token);
    setUsername(data.user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-sm bg-gray-800 shadow-xl rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">
          Register
        </h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            className="w-full p-2 border border-gray-700 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-amber-700"
            placeholder="Choose a Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            className="w-full p-2 border border-gray-700 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-amber-700"
            placeholder="Choose a Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error && <p className="text-amber-700 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-amber-700 text-white p-2 rounded-lg hover:bg-amber-800"
          >
            Create Account
          </button>
          <div className="text-gray-500 text-center text-sm">
            <span>have an account? </span>
            <Link className="text-blue-500" to={"/login"}>
              login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
