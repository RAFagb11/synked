import React, { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Navigation from "../components/Navigation";

const Register = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialUserType = searchParams.get("type") || "student";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState(initialUserType);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setError("");
      setLoading(true);
      await signup(email, password, userType);
      navigate("/create-profile");
    } catch (error) {
      setError("Failed to create an account: " + error.message);
    }

    setLoading(false);
  };

  return (
    <>
      <Navigation />
      <div
        className="container"
        style={{
          maxWidth: "500px",
          margin: "80px auto",
          padding: "30px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          borderRadius: "16px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
          Create Your Synked Account
        </h2>

        {error && (
          <div
            style={{
              color: "var(--danger)",
              marginBottom: "20px",
              padding: "10px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderRadius: "8px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Account Type
            </label>
            <div style={{ display: "flex", gap: "20px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  value="student"
                  checked={userType === "student"}
                  onChange={() => setUserType("student")}
                  style={{ marginRight: "8px" }}
                />
                Student
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  value="company"
                  checked={userType === "company"}
                  onChange={() => setUserType("company")}
                  style={{ marginRight: "8px" }}
                />
                Company
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "10px" }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--primary)", textDecoration: "none" }}
          >
            Log In
          </Link>
        </div>
      </div>
    </>
  );
};

export default Register;
