import React, { useState } from "react";
import API from "../api";
import logo from "../assets/logo.png";

export default function Login({ setLogged }) {
  const [user, setUser] = useState({ username: "", password: "" });
  const [mode, setMode] = useState("login");

  async function submit() {
    try {
      if (mode === "register") {
        await API.post("/auth/register", user);
        alert("Registered successfully! Now login.");
        setMode("login");
        return;
      }

      await API.post("/auth/login", user);
      setLogged(true);
    } catch (err) {
      alert(err?.response?.data?.detail || "Something went wrong");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* LEFT SIDE */}
        <div style={styles.left}>
          <div style={styles.overlay} />

          <div style={styles.leftContent}>
            <img src={logo} alt="EduEvalve Logo" style={styles.logo} />

            <h1 style={styles.title}>EduEvalve</h1>
            <p style={styles.subtitle}>
              AI-powered Answer Sheet Evaluation <br />
              (Hybrid OCR + Semantic Scoring)
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div style={styles.right}>
          <h2 style={styles.formTitle}>
            {mode === "login" ? "Login" : "Register"}
          </h2>

          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            placeholder="Enter username"
            value={user.username}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Enter password"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
          />

          <button style={styles.button} onClick={submit}>
            {mode === "login" ? "Login" : "Register"}
          </button>

          <p style={styles.switchText}>
            {mode === "login" ? (
              <>
                New user?{" "}
                <span style={styles.switchLink} onClick={() => setMode("register")}>
                  Register
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span style={styles.switchLink} onClick={() => setMode("login")}>
                  Login
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(120deg, #e0f2fe, #f8fafc)",
    padding: "20px",
  },

  card: {
    width: "950px",
    height: "520px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    borderRadius: "22px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0px 15px 40px rgba(0,0,0,0.12)",
  },

  left: {
    position: "relative",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=60')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
  },

  leftContent: {
    position: "relative",
    zIndex: 2,
    height: "100%",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "15px",
    color: "white",
  },

  logo: {
    width: "65px",
    height: "65px",
    objectFit: "contain",
    background: "white",
    padding: "8px",
    borderRadius: "14px",
  },

  title: {
    fontSize: "42px",
    margin: 0,
  },

  subtitle: {
    fontSize: "16px",
    lineHeight: "1.6",
    opacity: 0.9,
    margin: 0,
  },

  right: {
    padding: "50px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "12px",
  },

  formTitle: {
    marginBottom: "10px",
    fontSize: "28px",
    fontWeight: "700",
  },

  label: {
    fontSize: "14px",
    fontWeight: "600",
    marginTop: "6px",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    outline: "none",
  },

  button: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "600",
  },

  switchText: {
    marginTop: "10px",
    fontSize: "14px",
  },

  switchLink: {
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "600",
  },
};
