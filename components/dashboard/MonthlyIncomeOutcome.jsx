import React from "react";
import "./MonthlyIncomeOutcome.css";

const formatCurrency = (value) => `${value.toFixed(0)}`;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MonthlyIncomeOutcome({ monthlySeries }) {
  if (!monthlySeries || monthlySeries.length === 0) {
    return <div className="chart-empty">No data</div>;
  }

  const maxValue = Math.max(
    ...monthlySeries.map((m) => Math.max(m.realIncome, m.realOutcome))
  );

  return (
    <div className="monthly-income-outcome">
      <h4 className="chart-title">Monthly Income vs Outcome</h4>
      <div className="monthly-chart">
        <div className="monthly-bars">
          {monthlySeries.map((month) => {
            const incomeHeight = maxValue > 0 ? (month.realIncome / maxValue) * 100 : 0;
            const outcomeHeight = maxValue > 0 ? (month.realOutcome / maxValue) * 100 : 0;

            return (
              <div key={month.month} className="monthly-bar-group">
                <div className="monthly-bar-pair">
                  <div
                    className="monthly-bar monthly-bar-income"
                    style={{ height: `${incomeHeight}%` }}
                    title={`Income: ${formatCurrency(month.realIncome)} EUR`}
                  />
                  <div
                    className="monthly-bar monthly-bar-outcome"
                    style={{ height: `${outcomeHeight}%` }}
                    title={`Outcome: ${formatCurrency(month.realOutcome)} EUR`}
                  />
                </div>
                <span className="monthly-label">{MONTHS_SHORT[month.month]}</span>
              </div>
            );
          })}
        </div>
        <div className="monthly-legend">
          <div className="legend-item">
            <span className="legend-dot legend-dot-income"></span>
            <span>Income</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-dot-outcome"></span>
            <span>Outcome</span>
          </div>
        </div>
      </div>
    </div>
  );
}
