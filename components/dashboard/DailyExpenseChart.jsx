import React, { useState } from "react";
import "./DailyExpenseChart.css";

export default function DailyExpenseChart({
  dailyExpenses,
  selectedYear,
  selectedMonth,
  language = "fr",
}) {
  const labels = {
    fr: {
      title: "Dépenses quotidiennes",
      empty: "Aucune dépense pour cette période.",
      max: "Max",
      day: "Jour",
      total: "Total",
      average: "Moyenne",
      days: "Jours",
      locale: "fr-FR",
    },
    en: {
      title: "Daily Expenses",
      empty: "No expense data for this period.",
      max: "Max",
      day: "Day",
      total: "Total",
      average: "Average",
      days: "Days",
      locale: "en-US",
    },
  };
  const t = labels[language] || labels.fr;
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const hasMonthSelected = selectedMonth !== "" && selectedMonth !== null && selectedMonth !== undefined;

  if (!hasMonthSelected) {
    return null;
  }

  if (!dailyExpenses || dailyExpenses.length === 0) {
    return (
      <div className="daily-expense-chart">
        <h3 className="chart-title">{t.title}</h3>
        <p className="chart-empty">{t.empty}</p>
      </div>
    );
  }

  const maxExpense = Math.max(...dailyExpenses.map(d => d.amount), 1);
  
  // Calculate the number of days in the selected month/year
  const year = Number(selectedYear);
  
  let daysInMonth, minDay, maxDay, dayRange, monthName, dateRange;
  
  if (hasMonthSelected) {
    // Specific month selected
    const month = Number(selectedMonth); // 0-based month (0 = January)
    daysInMonth = new Date(year, month + 1, 0).getDate();
    minDay = 1;
    maxDay = daysInMonth;
    dayRange = maxDay - minDay;
    monthName = getMonthName(month, t.locale);
    dateRange = `${monthName} ${selectedYear}`;
  } else {
    // All months - use actual day range from data
    minDay = Math.min(...dailyExpenses.map(d => d.day));
    maxDay = Math.max(...dailyExpenses.map(d => d.day));
    dayRange = maxDay - minDay || 1;
    dateRange = `${selectedYear}`;
  }

  // Generate SVG path based on actual day numbers
  const chartPaddingX = 4.5;
  const chartPaddingTop = 24;
  const chartPaddingBottom = 10;
  const usableWidth = 100 - chartPaddingX * 2;
  const usableHeight = 100 - chartPaddingTop - chartPaddingBottom;
  const chartBottom = 100 - chartPaddingBottom;

  const totalAmount = dailyExpenses.reduce((sum, d) => sum + d.amount, 0);

  const points = dailyExpenses.map((d) => {
    const x = chartPaddingX + ((d.day - minDay) / dayRange) * usableWidth;
    const y = chartBottom - ((d.amount / maxExpense) * usableHeight);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="daily-expense-chart">
      <h3 className="chart-title">{t.title}</h3>
      <div className="chart-info">
        <span className="chart-period">{dateRange}</span>
        <span className="chart-max">
          {t.max}: €{maxExpense.toFixed(2)}
        </span>
      </div>
      
      <div className="chart-container">
        <div className="chart-plot">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart">
          {/* Grid lines */}
          <line x1="0" y1="20" x2="100" y2="20" className="grid-line" />
          <line x1="0" y1="40" x2="100" y2="40" className="grid-line" />
          <line x1="0" y1="60" x2="100" y2="60" className="grid-line" />
          <line x1="0" y1="80" x2="100" y2="80" className="grid-line" />
          
          {/* Area under line */}
          <polygon
            points={`${chartPaddingX},${chartBottom} ${points} ${100 - chartPaddingX},${chartBottom}`}
            className="line-area"
          />
          
          {/* Line */}
          <polyline
            points={points}
            className="line-path"
          />
        </svg>

        {/* Data points */}
        {dailyExpenses.map((d) => {
          const x = chartPaddingX + ((d.day - minDay) / dayRange) * usableWidth;
          const y = chartBottom - ((d.amount / maxExpense) * usableHeight);
          const displayDate = hasMonthSelected
            ? `${monthName} ${d.day}`
            : `${t.day} ${d.day}`;
          return (
            <div
              key={d.day}
              className="line-point-dot"
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() =>
                setHoveredPoint({
                  x,
                  y,
                  label: `${displayDate}: €${d.amount.toFixed(2)}`,
                })
              }
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        })}
        {hoveredPoint && (
          <div
            className="line-point-tooltip"
            style={{
              left: `${hoveredPoint.x}%`,
              top: `${hoveredPoint.y}%`,
            }}
          >
            {hoveredPoint.label}
          </div>
        )}
        </div>
        
      <div className="chart-x-axis">
          <span>
            {hasMonthSelected ? `${monthName} 1` : `${t.day} ${minDay}`}
          </span>
          <span>
            {hasMonthSelected ? `${monthName} ${maxDay}` : `${t.day} ${maxDay}`}
          </span>
      </div>
      </div>
      
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">{t.total}</span>
          <span className="summary-value expense">
            €{totalAmount.toFixed(2)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">{t.average}</span>
          <span className="summary-value">
            €{(totalAmount / dailyExpenses.length).toFixed(2)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">{t.days}</span>
          <span className="summary-value">{dailyExpenses.length}</span>
        </div>
      </div>
    </div>
  );
}

function getMonthName(month, locale) {
  const monthIndex = Number(month);
  if (!Number.isFinite(monthIndex)) return "";
  const date = new Date(2020, monthIndex, 1);
  return date.toLocaleString(locale || "en-US", { month: "long" });
}
