import React, { useMemo } from "react";
import "./MonthlyStats.css";

const formatCurrency = (value) =>
  `${Number.isFinite(value) ? value.toFixed(2) : "0.00"} EUR`;

const getLatestDate = (items) => {
  const dates = items
    .map((item) => new Date(item.date))
    .filter((dt) => !Number.isNaN(dt.getTime()))
    .sort((a, b) => b - a);
  return dates[0] || new Date();
};

const getReferenceDate = (items, year, month) => {
  if (year && Number.isFinite(Number(month))) {
    const monthIndex = Math.max(0, Math.min(11, Number(month)));
    return new Date(Number(year), monthIndex, 1);
  }
  if (year) {
    return new Date(Number(year), 0, 1);
  }
  return getLatestDate(items);
};

export default function MonthlyStats({ transactions, selectedYear, selectedMonth }) {
  const referenceDate = useMemo(
    () => getReferenceDate(transactions, selectedYear, selectedMonth),
    [selectedMonth, selectedYear, transactions]
  );

  const { monthly } = useMemo(() => {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const monthItems = [];
    for (const item of transactions) {
      const dt = new Date(item.date);
      if (Number.isNaN(dt.getTime())) continue;
      if (dt.getFullYear() === year && dt.getMonth() === month) {
        monthItems.push(item);
      }
    }

    const sumTotals = (items) => {
      let income = 0;
      let outcome = 0;
      for (const item of items) {
        const amount = item.amount || 0;
        if (item.type === "income") {
          income += amount;
        } else {
          outcome += amount;
        }
      }
      return {
        income,
        outcome,
        balance: income - outcome,
        count: items.length,
      };
    };

    return {
      monthly: sumTotals(monthItems),
    };
  }, [referenceDate, transactions]);

  const monthLabel = referenceDate.toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="monthly-stats">
      <div className="monthly-cards">
        <div className="monthly-card">
          <span className="card-label">Month balance</span>
          <strong
            className={`card-value ${
              monthly.balance >= 0 ? "is-income" : "is-expense"
            }`}
          >
            {formatCurrency(monthly.balance)}
          </strong>
          <span className="card-meta">Income minus outcome</span>
        </div>
        <div className="monthly-card">
          <span className="card-label">Month income</span>
          <strong className="card-value is-income">
            {formatCurrency(monthly.income)}
          </strong>
          <span className="card-meta">All income for {monthLabel}</span>
        </div>
        <div className="monthly-card">
          <span className="card-label">Month outcome</span>
          <strong className="card-value is-expense">
            {formatCurrency(monthly.outcome)}
          </strong>
          <span className="card-meta">Expenses for {monthLabel}</span>
        </div>
        <div className="monthly-card">
          <span className="card-label">Transactions</span>
          <strong className="card-value">{monthly.count}</strong>
          <span className="card-meta">Total for {monthLabel}</span>
        </div>
      </div>
      <div></div>
      <div></div>
    </div>
  );
}
