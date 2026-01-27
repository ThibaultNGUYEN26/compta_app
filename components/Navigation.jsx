import React from "react";
import "./Navigation.css";

export default function Navigation({ currentView, onViewChange }) {
  return (
    <nav className="app-nav">
      <button
        type="button"
        className={`nav-button ${currentView === "home" ? "is-active" : ""}`}
        onClick={() => onViewChange("home")}
      >
        Overview
      </button>
      <button
        type="button"
        className={`nav-button ${currentView === "archive" ? "is-active" : ""}`}
        onClick={() => onViewChange("archive")}
      >
        Archive
      </button>
      <button
        type="button"
        className={`nav-button ${currentView === "stats" ? "is-active" : ""}`}
        onClick={() => onViewChange("stats")}
      >
        Dashboard
      </button>
    </nav>
  );
}
