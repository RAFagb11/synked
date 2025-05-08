// src/pages/NotFound.js
import React from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";

const NotFound = () => {
  return (
    <>
      <Navigation />
      <div
        style={{
          padding: "120px 0",
          textAlign: "center",
          background: "linear-gradient(135deg, #f5f7ff 0%, #eef1ff 100%)",
        }}
      >
        <div className="container">
          <h1
            style={{
              fontSize: "120px",
              margin: "0",
              background:
                "linear-gradient(to right, var(--primary), var(--gradient-end))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            404
          </h1>
          <h2 style={{ fontSize: "36px", marginBottom: "20px" }}>
            Page Not Found
          </h2>
          <p
            style={{
              fontSize: "18px",
              color: "#666",
              maxWidth: "600px",
              margin: "0 auto 40px",
            }}
          >
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;
