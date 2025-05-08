// src/components/ProjectPreview.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

const ProjectPreview = ({ project, onClose }) => {
  const [activeTab, setActiveTab] = useState("details");

  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    if (timestamp.seconds) {
      // Firestore timestamp
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } else {
      // ISO string
      return new Date(timestamp).toLocaleDateString();
    }
  };

  return (
    <div className="project-preview-modal">
      <div className="project-preview-backdrop" onClick={onClose}></div>
      <div className="project-preview-content">
        <button className="project-preview-close" onClick={onClose}>
          ×
        </button>

        <div className="project-preview-header">
          <div className="feature-badge">{project.category}</div>
          <h2>{project.title}</h2>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <span className="feature-badge">{project.duration}</span>
            <span
              className="feature-badge"
              style={{
                background:
                  project.status === "open"
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(251, 191, 36, 0.1)",
                color:
                  project.status === "open"
                    ? "var(--success)"
                    : "var(--warning)",
              }}
            >
              {project.status === "open"
                ? "Open for Applications"
                : "Applications Closed"}
            </span>
            <span className="feature-badge">
              {project.isExperienceOnly
                ? "Experience Only"
                : `$${project.compensation}`}
            </span>
          </div>
        </div>

        <div className="project-preview-tabs">
          <button
            className={`project-preview-tab ${
              activeTab === "details" ? "active" : ""
            }`}
            onClick={() => setActiveTab("details")}
          >
            Project Details
          </button>
          <button
            className={`project-preview-tab ${
              activeTab === "company" ? "active" : ""
            }`}
            onClick={() => setActiveTab("company")}
          >
            Company Info
          </button>
          <button
            className={`project-preview-tab ${
              activeTab === "skills" ? "active" : ""
            }`}
            onClick={() => setActiveTab("skills")}
          >
            Required Skills
          </button>
        </div>

        <div className="project-preview-body">
          {activeTab === "details" && (
            <div className="project-preview-section">
              <h3>Project Description</h3>
              <p>{project.description}</p>

              <div style={{ marginTop: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ fontWeight: "500" }}>Posted On:</span>
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ fontWeight: "500" }}>Duration:</span>
                  <span>{project.duration}</span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontWeight: "500" }}>Compensation:</span>
                  <span>
                    {project.isExperienceOnly
                      ? "Experience Only"
                      : `$${project.compensation}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "company" && (
            <div className="project-preview-section">
              <h3>Company Information</h3>
              {project.companyInfo ? (
                <>
                  <div style={{ marginBottom: "15px" }}>
                    <h4>{project.companyInfo.companyName}</h4>
                    <p style={{ color: "#666" }}>
                      {project.companyInfo.industry}
                    </p>
                  </div>
                  <p>{project.companyInfo.companyDescription}</p>

                  <div style={{ marginTop: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <span style={{ fontWeight: "500" }}>Location:</span>
                      <span>
                        {project.companyInfo.location || "Not specified"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: "500" }}>Company Size:</span>
                      <span>
                        {project.companyInfo.companySize || "Not specified"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p>Loading company information...</p>
              )}
            </div>
          )}

          {activeTab === "skills" && (
            <div className="project-preview-section">
              <h3>Required Skills</h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "15px",
                }}
              >
                {project.skills?.map((skill) => (
                  <span key={skill} className="feature-badge">
                    {skill}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: "30px" }}>
                <h4>Ideal Candidate:</h4>
                <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
                  <li>Has experience with the required skills</li>
                  <li>
                    Can commit to the project duration ({project.duration})
                  </li>
                  <li>Is passionate about the project domain</li>
                  <li>Has good communication skills</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="project-preview-footer">
          <button onClick={onClose} className="btn btn-outline">
            Close Preview
          </button>
          <Link to={`/projects/${project.id}`} className="btn btn-primary">
            View Full Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectPreview;
