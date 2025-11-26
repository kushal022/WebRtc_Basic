import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Lobby from "./screens/Lobby";
import Room from "./screens/Room";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./context/AuthProvider";
import Home from "./pages/Home";

const App = () => {
  const { token, logout, user } = useAuth();

  return (
    <div className="text-white bg-gray-900 min-h-screen w-full">
      <div className="px-4 min-h-5 py-1 flex justify-end">
        {token && (
          <div className="flex gap-4 justify-end ">
            <div className="text-amber-500 font-bold italic ">@{user}</div>
            <button className="bg-amber-500 px-3 py-1 rounded" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />
        <Route
          path="/login"
          element={token ? <Navigate to="/lobby" /> : <Login />}
        />
        <Route
          path="/register"
          element={
            token ? (
              <h1 className="text-center text-amber-700">
                Plz Logout first..!
              </h1>
            ) : (
              <Register />
            )
          }
        />
        <Route
          path="/lobby"
          element={token ? <Lobby /> : <Navigate to="/login" />}
        />
        <Route
          path="/room/:roomId"
          element={token ? <Room /> : <Navigate to="/login" />}
        />
      </Routes>
    </div>
  );
};

export default App;
