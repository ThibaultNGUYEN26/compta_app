import React from "react";
import "./MonthlyIncomeExpenseChart.css";

const formatCurrency = (value) => `${value.toFixed(0)} EUR`;

export default function MonthlyIncomeExpenseChart({
  monthlySeries,
  selectedYear,
  language = "fr",
}) {
  const labels = {
    fr: {
      title: "Revenus et dépenses par mois",
      income: "Revenus",
      expenses: "Dépenses",
      empty: "Aucune donnée",
      locale: "fr-FR",
    },
    en: {
      title: "Income and Expenses by Month",
      income: "Income",
      expenses: "Expenses",
      empty: "No data",
      locale: "en-US",
    },
  };
  const t = labels[language] || labels.fr;

  const hasData =
    Array.isArray(monthlySeries) &&
    monthlySeries.some((m) => (m.realIncome || 0) > 0 || (m.realOutcome || 0) > 0);

  if (!hasData) {
    return (
      <div className="monthly-income-expense">
        <h3 className="chart-title">{t.title}</h3>
        <p className="chart-empty">{t.empty}</p>
      </div>
    );
  }

  const maxValue = Math.max(
    ...monthlySeries.map((m) => Math.max(m.realIncome || 0, m.realOutcome || 0)),
    1
  );

  const monthFormatter = new Intl.DateTimeFormat(t.locale, { month: "short" });

  return (
    <div className="monthly-income-expense">
      <div className="chart-header">
        <h3 className="chart-title">{t.title}</h3>
        <span className="chart-period">{selectedYear}</span>
      </div>
      <div className="monthly-bars">
        {monthlySeries.map((m) => {
          const incomePct = (m.realIncome / maxValue) * 100;
          const expensePct = (m.realOutcome / maxValue) * 100;
          const label = monthFormatter.format(new Date(2020, m.month, 1));
          return (
            <div key={m.month} className="monthly-bars-item">
              <div className="monthly-bars-stack">
                <div
                  className="monthly-bar monthly-bar-income"
                  style={{ height: `${incomePct}%` }}
                  title={`${t.income}: ${formatCurrency(m.realIncome)}`}
                />
                <div
                  className="monthly-bar monthly-bar-expense"
                  style={{ height: `${expensePct}%` }}
                  title={`${t.expenses}: ${formatCurrency(m.realOutcome)}`}
                />
              </div>
              <span className="monthly-bar-label">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="monthly-legend">
        <div className="legend-item">
          <span className="legend-dot legend-dot-income"></span>
          <span>{t.income}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot-expense"></span>
          <span>{t.expenses}</span>
        </div>
      </div>
    </div>
  );
}
