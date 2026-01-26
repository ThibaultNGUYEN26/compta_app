import React, { useEffect, useMemo, useState } from "react";
import TransactionList from "./TransactionList";
import DashboardStats from "./DashboardStats";
import "./ArchivePage.css";

export default function ArchivePage({
  transactions,
  onUpdate,
  onDelete,
  currentAccounts,
  savingAccounts,
}) {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

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

  return (
    <main className="app-archive">
      <section className="panel panel-archive">
        <DashboardStats
          transactions={transactions}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth ? Number(selectedMonth) - 1 : undefined}
        />
        <div className="archive-header">
          <div>
            <h2 className="panel-title">Archive</h2>
            <p className="archive-subtitle">
              Select a year and month to browse transactions.
            </p>
          </div>
          <div className="archive-controls">
            <label className="archive-field">
              <span>Year</span>
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
              <span>Month</span>
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
                        ).toLocaleString(undefined, { month: "long" });
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
          transactions={
            selectedYear && selectedMonth
              ? archiveData.byYear[selectedYear]?.[selectedMonth] || []
              : []
          }
          limit={null}
          onUpdate={onUpdate}
          onDelete={onDelete}
          currentAccounts={currentAccounts}
          savingAccounts={savingAccounts}
        />
      </section>
    </main>
  );
}
