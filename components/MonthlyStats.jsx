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

export default function MonthlyStats({
  transactions,
  selectedYear,
  selectedMonth,
  scope,
  maskAmounts = false,
  language = "fr",
}) {
  const labels = {
    fr: {
      balance: "Solde du mois",
      income: "Entrées du mois",
      outcome: "Sorties du mois",
      transactions: "Transactions",
      balanceMeta: "Entrées moins sorties",
      incomeMeta: (label) => `Entrées pour ${label}`,
      outcomeMeta: (label) => `Sorties pour ${label}`,
      transactionsMeta: (label) => `Total pour ${label}`,
      locale: "fr-FR",
    },
    en: {
      balance: "Month balance",
      income: "Month income",
      outcome: "Month outcome",
      transactions: "Transactions",
      balanceMeta: "Income minus outcome",
      incomeMeta: (label) => `Incomes for ${label}`,
      outcomeMeta: (label) => `Expenses for ${label}`,
      transactionsMeta: (label) => `Total for ${label}`,
      locale: "en-US",
    },
  };
  const t = labels[language] || labels.fr;
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
        if (item.category === "Transfer" && scope?.type === "current" && scope?.name) {
          if (item.transferAccount === scope.name) {
            income += amount;
          } else if (item.currentAccount === scope.name) {
            outcome += amount;
          }
          continue;
        }
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

  const monthLabel = referenceDate.toLocaleString(t.locale, {
    month: "short",
    year: "numeric",
  });

  const renderCurrency = (value) =>
    maskAmounts ? "***** EUR" : formatCurrency(value);

  return (
    <div className="monthly-stats">
      <div className="monthly-cards">
        <div className="monthly-card">
          <span className="card-label">{t.balance}</span>
          <strong
            className={`card-value ${
              monthly.balance >= 0 ? "is-income" : "is-expense"
            }`}
          >
            {renderCurrency(monthly.balance)}
          </strong>
          <span className="card-meta">{t.balanceMeta}</span>
        </div>
        <div className="monthly-card">
          <span className="card-label">{t.income}</span>
          <strong className="card-value is-income">
            {renderCurrency(monthly.income)}
          </strong>
          <span className="card-meta">{t.incomeMeta(monthLabel)}</span>
        </div>
        <div className="monthly-card">
          <span className="card-label">{t.outcome}</span>
          <strong className="card-value is-expense">
            {renderCurrency(monthly.outcome)}
          </strong>
          <span className="card-meta">{t.outcomeMeta(monthLabel)}</span>
        </div>
        <div className="monthly-card">
          <span className="card-label">{t.transactions}</span>
          <strong className="card-value">{monthly.count}</strong>
          <span className="card-meta">{t.transactionsMeta(monthLabel)}</span>
        </div>
      </div>
      <div></div>
      <div></div>
    </div>
  );
}
