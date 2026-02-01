import React, { useEffect, useMemo, useState } from "react";
import TransactionList from "./TransactionList";
import MonthlyStats from "./MonthlyStats";
import { filterByScope } from "../utils/dashboardUtils";
import "./ArchivePage.css";

export default function ArchivePage({
  transactions,
  onUpdate,
  onDelete,
  currentAccounts,
  savingAccounts,
  savingLinks = {},
  categories = [],
  maskAmounts = false,
  language = "fr",
}) {
  const labels = {
    fr: {
      title: "Archives",
      subtitle: "Sélectionnez une année et un mois pour parcourir les transactions.",
      account: "Compte",
      year: "Année",
      month: "Mois",
      accountLabel: "Compte",
      allTypes: "Tous les types",
      months: "long",
      accountFallback: "Compte courant",
    },
    en: {
      title: "Archive",
      subtitle: "Select a year and month to browse transactions.",
      account: "Account",
      year: "Year",
      month: "Month",
      accountLabel: "Account",
      allTypes: "All types",
      months: "long",
      accountFallback: "Current account",
    },
  };
  const t = labels[language] || labels.fr;
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [scopeValue, setScopeValue] = useState("");

  const archiveData = useMemo(() => {
    const byYear = {};
    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      if (Number.isNaN(date.getTime())) continue;
      const yearKey = String(date.getFullYear());
      const monthKey = String(date.getMonth() + 1).padStart(2, "0");
      if (!byYear[yearKey]) byYear[yearKey] = {};
      if (!byYear[yearKey][monthKey]) byYear[yearKey][monthKey] = [];
      byYear[yearKey][monthKey].push(transaction);
    }
    const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));
    return { years, byYear };
  }, [transactions]);

  useEffect(() => {
    if (!archiveData.years.length) {
      setSelectedYear("");
      setSelectedMonth("");
      return;
    }
    if (!selectedYear || !archiveData.byYear[selectedYear]) {
      const nextYear = archiveData.years[0];
      setSelectedYear(nextYear);
    }
  }, [archiveData, selectedYear]);

  useEffect(() => {
    if (!selectedYear) {
      setSelectedMonth("");
      return;
    }
    const months = Object.keys(archiveData.byYear[selectedYear] || {}).sort(
      (a, b) => Number(a) - Number(b)
    );
    if (!months.length) {
      setSelectedMonth("");
      return;
    }
    if (!selectedMonth || !months.includes(selectedMonth)) {
      setSelectedMonth(months[0]);
    }
  }, [archiveData, selectedYear, selectedMonth]);

  const scopeOptions = useMemo(() => {
    return (currentAccounts || []).map((name) => ({
      value: `current::${name}`,
      label: name,
    }));
  }, [currentAccounts]);

  useEffect(() => {
    const valid = scopeOptions.some((opt) => opt.value === scopeValue);
    if (!valid && scopeOptions.length) {
      setScopeValue(scopeOptions[0].value);
    }
  }, [scopeOptions, scopeValue]);

  const parseScope = (value) => {
    const [type, name] = value.split("::");
    return { type: type || "current", name: name || "" };
  };

  const scope = useMemo(() => parseScope(scopeValue), [scopeValue]);

  const monthTransactions = useMemo(() => {
    return selectedYear && selectedMonth
      ? archiveData.byYear[selectedYear]?.[selectedMonth] || []
      : [];
  }, [archiveData, selectedMonth, selectedYear]);

  const filteredTransactions = useMemo(() => {
    return filterByScope(monthTransactions, scope.type, scope.name, savingLinks);
  }, [monthTransactions, scope, savingLinks]);

  return (
    <main className="app-archive">
      <section className="panel panel-archive">
        <MonthlyStats
          transactions={filteredTransactions}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth ? Number(selectedMonth) - 1 : undefined}
          scope={scope}
          maskAmounts={maskAmounts}
          language={language}
        />
        <div className="archive-header">
          <div>
            <h2 className="panel-title">{t.title}</h2>
            <p className="archive-subtitle">{t.subtitle}</p>
          </div>
          <div className="archive-controls">
            <label className="archive-field">
              <span>{t.account}</span>
              <select
                value={scopeValue}
                onChange={(e) => setScopeValue(e.target.value)}
              >
                {scopeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="archive-field">
              <span>{t.year}</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {archiveData.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="archive-field">
              <span>{t.month}</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={!selectedYear}
              >
                {(archiveData.byYear[selectedYear]
                  ? Object.keys(archiveData.byYear[selectedYear])
                      .sort((a, b) => Number(a) - Number(b))
                      .map((month) => {
                        const label = new Date(
                          Number(selectedYear),
                          Number(month) - 1,
                          1
                        ).toLocaleString(
                          language === "fr" ? "fr-FR" : "en-US",
                          { month: "long" }
                        );
                        return (
                          <option key={month} value={month}>
                            {label}
                          </option>
                        );
                      })
                  : []
                )}
              </select>
            </label>
          </div>
        </div>
        <TransactionList
          transactions={filteredTransactions}
          limit={null}
          onUpdate={onUpdate}
          onDelete={onDelete}
          currentAccounts={currentAccounts}
          savingAccounts={savingAccounts}
          categories={categories}
          maskAmounts={maskAmounts}
          scope={scope}
          language={language}
        />
      </section>
    </main>
  );
}
