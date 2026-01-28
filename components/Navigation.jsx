import React from "react";
import "./Navigation.css";

export default function Navigation({ currentView, onViewChange, language = "fr" }) {
  const labels = {
    fr: {
      home: "Aperçu",
      archive: "Archive",
      stats: "Tableau de bord",
    },
    en: {
      home: "Overview",
      archive: "Archive",
      stats: "Dashboard",
    },
  };
  const t = labels[language] || labels.fr;

  return (
    <nav className="app-nav">
      <button
        type="button"
        className={`nav-button ${currentView === "home" ? "is-active" : ""}`}
        onClick={() => onViewChange("home")}
      >
        {t.home}
      </button>
      <button
        type="button"
        className={`nav-button ${currentView === "archive" ? "is-active" : ""}`}
        onClick={() => onViewChange("archive")}
      >
        {t.archive}
      </button>
      <button
        type="button"
        className={`nav-button ${currentView === "stats" ? "is-active" : ""}`}
        onClick={() => onViewChange("stats")}
      >
        {t.stats}
      </button>
    </nav>
  );
}
