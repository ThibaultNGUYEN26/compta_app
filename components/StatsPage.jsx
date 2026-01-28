import React, { useEffect, useMemo, useState } from "react";
import DashboardControls from "./dashboard/DashboardControls";
import KPISection from "./dashboard/KPISection";
import MonthlyIncomeOutcome from "./dashboard/MonthlyIncomeOutcome";
import CategoryBreakdown from "./dashboard/CategoryBreakdown";
import SavingsAnalysis from "./dashboard/SavingsAnalysis";
import TransactionDrilldown from "./dashboard/TransactionDrilldown";
import DailyExpenseChart from "./dashboard/DailyExpenseChart";
import {
  filterByDateRange,
  filterByScope,
  computeKpis,
  computeCategoryBreakdown,
  computeSavingsBySavingAccount,
  computeDailyExpenses,
} from "../utils/dashboardUtils";
import "./StatsPage.css";

export default function StatsPage({
  transactions,
  currentAccounts = [],
  savingAccounts = [],
  savingLinks = {},
}) {
  const settingsAccounts = useMemo(() => {
    return {
      current: Array.isArray(currentAccounts) ? currentAccounts : [],
      saving: Array.isArray(savingAccounts) ? savingAccounts : [],
      savingLinks:
        savingLinks && typeof savingLinks === "object" ? savingLinks : {},
    };
  }, [currentAccounts, savingAccounts, savingLinks]);

  const accountLists = useMemo(() => {
    const currentSet = new Set(settingsAccounts.current || []);
    const savingSet = new Set(settingsAccounts.saving || []);

    for (const item of transactions) {
      if (item.currentAccount) currentSet.add(item.currentAccount);
      if (item.savingAccount) savingSet.add(item.savingAccount);
      if (item.accountName) {
        if (item.category === "Saving" || item.accountType === "saving") {
          savingSet.add(item.accountName);
        } else {
          currentSet.add(item.accountName);
        }
      }
    }

    const current = Array.from(currentSet).filter(Boolean);
    const saving = Array.from(savingSet).filter(Boolean);
    if (!current.length) current.push("Current account");
    return { current, saving };
  }, [settingsAccounts, transactions]);

  const years = useMemo(() => {
    const yearSet = new Set();
    transactions.forEach((t) => {
      const date = new Date(t.date);
      if (!isNaN(date.getTime())) {
        yearSet.add(String(date.getFullYear()));
      }
    });
    const yearArray = Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
    return yearArray.length ? yearArray : [String(new Date().getFullYear())];
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [scopeValue, setScopeValue] = useState("all");

  useEffect(() => {
    if (!years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [selectedYear, years]);

  const scopeOptions = useMemo(() => {
    const options = [{ value: "all", label: "All current accounts" }];
    accountLists.current.forEach((name) => {
      options.push({ value: `current::${name}`, label: `${name}` });
    });
    return options;
  }, [accountLists]);

  useEffect(() => {
    if (scopeValue === "all") return;
    const valid = scopeOptions.some((opt) => opt.value === scopeValue);
    if (!valid) setScopeValue("all");
  }, [scopeOptions, scopeValue]);

  const parseScope = (value) => {
    if (value === "all") return { type: "current", name: "" };
    if (!value.includes("::")) {
      return { type: "current", name: value || "" };
    }
    const [type, name] = value.split("::");
    return { type: type || "current", name: name || "" };
  };

  const scope = useMemo(() => parseScope(scopeValue), [scopeValue]);

  const dateFilteredTransactions = useMemo(() => {
    return filterByDateRange(transactions, selectedYear, selectedMonth);
  }, [transactions, selectedYear, selectedMonth]);

  const filteredTransactions = useMemo(() => {
    return filterByScope(
      dateFilteredTransactions,
      scope.type,
      scope.name,
      settingsAccounts.savingLinks
    );
  }, [dateFilteredTransactions, scope, settingsAccounts.savingLinks]);

  const kpis = useMemo(() => {
    return computeKpis(filteredTransactions, accountLists, scope);
  }, [filteredTransactions, accountLists, scope]);

  const categoryBreakdown = useMemo(() => {
    return computeCategoryBreakdown(filteredTransactions);
  }, [filteredTransactions]);

  const savingsByAccount = useMemo(() => {
    return computeSavingsBySavingAccount(
      dateFilteredTransactions,
      scope,
      settingsAccounts.savingLinks
    );
  }, [dateFilteredTransactions, scope, settingsAccounts.savingLinks]);

  const dailyExpenses = useMemo(() => {
    return computeDailyExpenses(filteredTransactions);
  }, [filteredTransactions]);

  return (
    <div className="stats-page">
      <DashboardControls
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        years={years}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        scopeValue={scopeValue}
        onScopeChange={setScopeValue}
        scopeOptions={scopeOptions}
      />

      <div className="stats-content">
        <div className="stats-top-row">
          <div className="stats-top-main">
            <KPISection kpis={kpis} />
          </div>
          <div className="stats-chart-card stats-donut-card">
            <MonthlyIncomeOutcome transactions={filteredTransactions} />
          </div>
        </div>

        <div className="stats-charts-grid">
          <div className="stats-chart-card">
            <CategoryBreakdown
              categories={categoryBreakdown}
              totalOutcome={kpis.realOutcome}
            />
          </div>

          <div className="stats-chart-card">
            <SavingsAnalysis savingsByAccount={savingsByAccount} />
          </div>
        </div>

        {selectedMonth !== "" && selectedMonth !== null && selectedMonth !== undefined && (
          <div className="stats-full-width">
            <DailyExpenseChart 
              dailyExpenses={dailyExpenses}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          </div>
        )}

        <div className="stats-drilldown">
          <TransactionDrilldown transactions={filteredTransactions} scope={scope} />
        </div>
      </div>
    </div>
  );
}
