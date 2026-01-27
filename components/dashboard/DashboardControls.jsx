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
}) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="dashboard-controls">
      <div className="control-group">
        <label className="control-label">
          <span>Year</span>
          <select value={selectedYear} onChange={(e) => onYearChange(e.target.value)}>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="control-label">
          <span>Month</span>
          <select
            value={selectedMonth}
            onChange={(e) =>
              onMonthChange(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">All months</option>
            {months.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="control-group">
        <label className="control-label">
          <span>Scope</span>
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
