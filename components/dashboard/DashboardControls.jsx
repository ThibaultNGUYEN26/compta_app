import React, { useEffect, useRef, useState } from "react";
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
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const scopeRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setYearOpen(false);
      }
      if (monthRef.current && !monthRef.current.contains(event.target)) {
        setMonthOpen(false);
      }
      if (scopeRef.current && !scopeRef.current.contains(event.target)) {
        setScopeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const yearLabel = selectedYear || (years.length ? years[0] : t.year);
  const monthLabel =
    selectedMonth === "" || selectedMonth === null || selectedMonth === undefined
      ? t.allMonths
      : t.months[selectedMonth] || t.allMonths;
  const scopeLabel =
    scopeOptions.find((option) => option.value === scopeValue)?.label ||
    scopeOptions[0]?.label ||
    t.scope;

  return (
    <div className="dashboard-controls">
      <div className="control-group">
        <label className="control-label">
          <span>{t.year}</span>
          <div className="category-picker" ref={yearRef}>
            <button
              type="button"
              className="category-trigger"
              onClick={() => setYearOpen((prev) => !prev)}
              aria-expanded={yearOpen}
              disabled={!years.length}
            >
              {yearLabel}
              <span className="category-caret" aria-hidden="true" />
            </button>
            {yearOpen && years.length > 0 && (
              <div className="category-menu" role="listbox">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={`category-option${
                      year === selectedYear ? " is-selected" : ""
                    }`}
                    onClick={() => {
                      onYearChange(year);
                      setYearOpen(false);
                    }}
                    role="option"
                    aria-selected={year === selectedYear}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </label>
        <label className="control-label">
          <span>{t.month}</span>
          <div className="category-picker" ref={monthRef}>
            <button
              type="button"
              className="category-trigger"
              onClick={() => setMonthOpen((prev) => !prev)}
              aria-expanded={monthOpen}
            >
              {monthLabel}
              <span className="category-caret" aria-hidden="true" />
            </button>
            {monthOpen && (
              <div className="category-menu" role="listbox">
                <button
                  type="button"
                  className={`category-option${
                    monthLabel === t.allMonths ? " is-selected" : ""
                  }`}
                  onClick={() => {
                    onMonthChange("");
                    setMonthOpen(false);
                  }}
                  role="option"
                  aria-selected={monthLabel === t.allMonths}
                >
                  {t.allMonths}
                </button>
                {t.months.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    className={`category-option${
                      index === selectedMonth ? " is-selected" : ""
                    }`}
                    onClick={() => {
                      onMonthChange(index);
                      setMonthOpen(false);
                    }}
                    role="option"
                    aria-selected={index === selectedMonth}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>
        </label>
      </div>
      <div className="control-group">
        <label className="control-label">
          <span>{t.scope}</span>
          <div className="category-picker" ref={scopeRef}>
            <button
              type="button"
              className="category-trigger"
              onClick={() => setScopeOpen((prev) => !prev)}
              aria-expanded={scopeOpen}
              disabled={!scopeOptions.length}
            >
              {scopeLabel}
              <span className="category-caret" aria-hidden="true" />
            </button>
            {scopeOpen && scopeOptions.length > 0 && (
              <div className="category-menu" role="listbox">
                {scopeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`category-option${
                      option.value === scopeValue ? " is-selected" : ""
                    }`}
                    onClick={() => {
                      onScopeChange(option.value);
                      setScopeOpen(false);
                    }}
                    role="option"
                    aria-selected={option.value === scopeValue}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </label>
      </div>
    </div>
  );
}
