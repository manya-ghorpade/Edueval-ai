import React from "react";

export default function Navbar({ setLogged, page, setPage }) {
  function NavBtn({ id, label }) {
    return (
      <button
        onClick={() => setPage(id)}
        style={{
          background: page === id ? "#2563eb" : "#374151"
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="navbar">
      <div style={{ fontWeight: "bold", fontSize: "18px" }}>
        EduEvalve
      </div>

      <div className="links">
        <NavBtn id="dashboard" label="Dashboard" />
        <NavBtn id="model" label="Model Answers" />
        <NavBtn id="upload" label="Upload & Evaluate" />
        <NavBtn id="results" label="Results" />

        <button
          onClick={() => setLogged(false)}
          style={{ background: "#ef4444" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
