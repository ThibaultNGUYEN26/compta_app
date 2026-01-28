import React, { useRef, useState } from "react";
import "./MonthlyIncomeOutcome.css";
import { isRealIncome, isRealOutcome } from "../../utils/dashboardUtils";

const formatCurrency = (value) => `${value.toFixed(0)} EUR`;

export default function MonthlyIncomeOutcome({ transactions, language = "fr" }) {
  const labels = {
    fr: {
      title: "Revenus vs Dépenses",
      noData: "Aucune donnée",
      income: "Revenus",
      expenses: "Dépenses",
      directDebit: "Prélèvement",
      total: "Total",
      aria: "Revenus vs Dépenses",
    },
    en: {
      title: "Incomes vs Expenses",
      noData: "No data",
      income: "Income",
      expenses: "Expenses",
      directDebit: "Direct Debit",
      total: "Total",
      aria: "Incomes vs Expenses",
    },
  };
  const t = labels[language] || labels.fr;
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const donutRef = useRef(null);

  if (!transactions || transactions.length === 0) {
    return <div className="chart-empty">{t.noData}</div>;
  }

  const totals = transactions.reduce(
    (acc, t) => {
      const amount = t.amount || 0;
      if (isRealIncome(t)) {
        acc.income += amount;
      } else if (isRealOutcome(t)) {
        acc.outcome += amount;
        if (t.isPrelevement) acc.prelevement += amount;
      }
      return acc;
    },
    { income: 0, outcome: 0, prelevement: 0 }
  );

  const expenseOnly = Math.max(totals.outcome - totals.prelevement, 0);
  const total = totals.income + expenseOnly + totals.prelevement;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  if (total <= 0) {
    return (
      <div className="monthly-income-outcome">
        <h4 className="chart-title">{t.title}</h4>
        <div className="chart-empty">{t.noData}</div>
      </div>
    );
  }

  const segments = [
    { label: t.income, value: totals.income, className: "donut-segment income" },
    { label: t.expenses, value: expenseOnly, className: "donut-segment expense" },
    { label: t.directDebit, value: totals.prelevement, className: "donut-segment prelevement" },
  ].filter((seg) => seg.value > 0);

  let cumulativeDash = 0;

  return (
    <div className="monthly-income-outcome">
      <h4 className="chart-title">{t.title}</h4>
      <div className="monthly-donut" ref={donutRef}>
        <svg
          viewBox="0 0 100 100"
          className="donut-chart"
          role="img"
          aria-label={t.aria}
        >
          {total <= 0 && (
            <circle className="donut-track" cx="50" cy="50" r={radius} />
          )}
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const dash = isLast
              ? Math.max(circumference - cumulativeDash, 0)
              : (segment.value / total) * circumference;
            const offset = -cumulativeDash;
            cumulativeDash += dash;
            const percent = total > 0 ? (segment.value / total) * 100 : 0;
            const label = `${segment.label}: ${formatCurrency(segment.value)} (${percent.toFixed(1)}%)`;
            return (
              <circle
                key={segment.label}
                className={segment.className}
                cx="50"
                cy="50"
                r={radius}
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={offset}
                onMouseEnter={() =>
                  setHoveredSegment((prev) => ({
                    ...prev,
                    label,
                  }))
                }
                onMouseMove={(event) => {
                  if (!donutRef.current) return;
                  const rect = donutRef.current.getBoundingClientRect();
                  setHoveredSegment({
                    label,
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => setHoveredSegment(null)}
                title={label}
              />
            );
          })}
          <text x="50" y="50" textAnchor="middle" className="donut-center-label">
            {t.total}
          </text>
          <text x="50" y="60" textAnchor="middle" className="donut-center-value">
            {formatCurrency(total)}
          </text>
        </svg>
        <div className="monthly-legend">
          <div className="legend-item">
            <span className="legend-dot legend-dot-income"></span>
            <span>{t.income}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-dot-expense"></span>
            <span>{t.expenses}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-dot-prelevement"></span>
            <span>{t.directDebit}</span>
          </div>
        </div>
        {hoveredSegment && (
          <div
            className="donut-tooltip"
            style={{
              left: hoveredSegment.x,
              top: hoveredSegment.y,
            }}
          >
            {hoveredSegment.label}
          </div>
        )}
      </div>
    </div>
  );
}
