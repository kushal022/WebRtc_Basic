import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { SERVER_URL } from "../config";

const Login = () => {
  const { login, setUsername: setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    console.log("login res: ", data);
    if (!res.ok || data.success === false) return setError(data.message);
    console.log("Login success!")
    login(data.token);
    setUser(data.user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-sm bg-gray-800 shadow-xl rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">
          Login
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full p-2 border border-gray-700 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-amber-700"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="w-full p-2 border border-gray-700 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-amber-700"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-amber-700 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-amber-700 text-white p-2 rounded-lg hover:bg-amber-800"
          >
            Login
          </button>
          <div className="text-gray-500 text-center text-sm">
            <span>do not have an account? </span>
            <Link className="text-blue-500" to={"/register"}>
              register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
