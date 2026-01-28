import React from "react";
import "./DashboardControls.css";

export default function DashboardControls({
  selectedYear,
  selectedMonth,
  years,
  onYearChange,
  onMonthChange,
  scopeValue,
  onScopeChange,
  scopeOptions,
  language = "fr",
}) {
  const labels = {
    fr: {
      year: "Année",
      month: "Mois",
      scope: "Périmètre",
      allMonths: "Tous les mois",
      months: [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
      ],
    },
    en: {
      year: "Year",
      month: "Month",
      scope: "Scope",
      allMonths: "All months",
      months: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ],
    },
  };
  const t = labels[language] || labels.fr;

  return (
    <div className="dashboard-controls">
      <div className="control-group">
        <label className="control-label">
          <span>{t.year}</span>
          <select value={selectedYear} onChange={(e) => onYearChange(e.target.value)}>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="control-label">
          <span>{t.month}</span>
          <select
            value={selectedMonth}
            onChange={(e) =>
              onMonthChange(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">{t.allMonths}</option>
            {t.months.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="control-group">
        <label className="control-label">
          <span>{t.scope}</span>
          <select value={scopeValue} onChange={(e) => onScopeChange(e.target.value)}>
            {scopeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
