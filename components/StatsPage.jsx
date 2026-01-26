import React, { useEffect, useMemo, useState } from "react";
import "./StatsPage.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatCurrency = (value) =>
  `${Number.isFinite(value) ? value.toFixed(2) : "0.00"} EUR`;

const parseScope = (value) => {
  if (value === "all") return { type: "all", name: "" };
  const [type, name] = value.split("::");
  return { type: type || "all", name: name || "" };
};

const isSavingTransfer = (item) => item.category === "Saving";

const getTransferAccounts = (item) => {
  const current = item.currentAccount || "Current account";
  const saving = item.savingAccount || item.accountName || "Savings account";
  if (item.type === "income") {
    return { from: saving, to: current };
  }
  return { from: current, to: saving };
};

const getExternalAccount = (item) => {
  if (item.accountName) return item.accountName;
  if (item.accountType === "saving") {
    return item.savingAccount || item.currentAccount || "Savings account";
  }
  return item.currentAccount || "Current account";
};

const getDayKey = (item) => {
  const dt = new Date(item.date);
  if (Number.isNaN(dt.getTime())) return null;
  return String(dt.getDate()).padStart(2, "0");
};

export default function StatsPage({ transactions }) {
  const [settingsAccounts, setSettingsAccounts] = useState({
    current: [],
    saving: [],
  });

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      if (!window.comptaApi?.loadSettings) return;
      const settings = await window.comptaApi.loadSettings();
      if (cancelled || !settings?.accounts) return;
      setSettingsAccounts({
        current: Array.isArray(settings.accounts.current)
          ? settings.accounts.current
          : [],
        saving: Array.isArray(settings.accounts.saving)
          ? settings.accounts.saving
          : [],
      });
    };
    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const dataByYear = useMemo(() => {
    const byYear = {};
    for (const item of transactions) {
      const dt = new Date(item.date);
      if (Number.isNaN(dt.getTime())) continue;
      const year = String(dt.getFullYear());
      const month = dt.getMonth();
      if (!byYear[year]) {
        byYear[year] = Array.from({ length: 12 }, () => []);
      }
      byYear[year][month].push(item);
    }
    return byYear;
  }, [transactions]);

  const years = useMemo(() => {
    const keys = Object.keys(dataByYear);
    if (!keys.length) return [String(new Date().getFullYear())];
    return keys.sort((a, b) => Number(b) - Number(a));
  }, [dataByYear]);

  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [scopeValue, setScopeValue] = useState("all");
  const [outcomeView, setOutcomeView] = useState("amount");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (!years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [selectedYear, years]);

  const scopeOptions = useMemo(() => {
    const options = [{ value: "all", label: "All accounts" }];
    accountLists.current.forEach((name) => {
      options.push({ value: `current::${name}`, label: `Current: ${name}` });
    });
    accountLists.saving.forEach((name) => {
      options.push({ value: `saving::${name}`, label: `Saving: ${name}` });
    });
    return options;
  }, [accountLists]);

  useEffect(() => {
    if (scopeValue === "all") return;
    const valid = scopeOptions.some((opt) => opt.value === scopeValue);
    if (!valid) setScopeValue("all");
  }, [scopeOptions, scopeValue]);

  const scope = useMemo(() => parseScope(scopeValue), [scopeValue]);

  const monthData = useMemo(() => {
    const yearData = dataByYear[selectedYear] || Array.from({ length: 12 }, () => []);
    return yearData[selectedMonth] || [];
  }, [dataByYear, selectedMonth, selectedYear]);

  const periodStats = useMemo(() => {
    let income = 0;
    let outcome = 0;
    let savingIn = 0;
    let savingOut = 0;
    let prelevements = 0;
    let incomeCount = 0;
    let outcomeCount = 0;
    let prelevementCount = 0;
    let savingCount = 0;
    let transferIn = 0;
    let transferOut = 0;
    let transferCount = 0;
    const categories = {};
    const dailyNet = {};

    for (const item of monthData) {
      const amount = item.amount || 0;
      const transfer = isSavingTransfer(item);
      if (transfer) {
        const { from, to } = getTransferAccounts(item);
        if (scope.type !== "all" && from !== scope.name && to !== scope.name) {
          continue;
        }
        transferCount += 1;
        if (item.type === "outcome") {
          if (
            scope.type === "all" ||
            (scope.type === "current" && from === scope.name) ||
            (scope.type === "saving" && to === scope.name)
          ) {
            savingIn += amount;
            savingCount += 1;
          }
        } else {
          if (
            scope.type === "all" ||
            (scope.type === "current" && to === scope.name) ||
            (scope.type === "saving" && from === scope.name)
          ) {
            savingOut += amount;
            savingCount += 1;
          }
        }

        if (scope.type !== "all") {
          if (from === scope.name) transferOut += amount;
          if (to === scope.name) transferIn += amount;
          const dayKey = getDayKey(item);
          if (dayKey) {
            const delta = (to === scope.name ? amount : 0) - (from === scope.name ? amount : 0);
            dailyNet[dayKey] = (dailyNet[dayKey] || 0) + delta;
          }
        }
        continue;
      }

      const accountName = getExternalAccount(item);
      if (scope.type !== "all" && accountName !== scope.name) {
        continue;
      }

      const isIncome = item.type === "income";
      if (isIncome) {
        income += amount;
        incomeCount += 1;
      } else {
        outcome += amount;
        outcomeCount += 1;
        const key = item.category || "Other";
        categories[key] = (categories[key] || 0) + amount;
        if (item.isPrelevement) {
          prelevements += amount;
          prelevementCount += 1;
        }
      }

      const dayKey = getDayKey(item);
      if (dayKey) {
        const delta = isIncome ? amount : -amount;
        dailyNet[dayKey] = (dailyNet[dayKey] || 0) + delta;
      }
    }

    const transferTotal =
      scope.type === "all" ? savingIn + savingOut : transferIn + transferOut;

    const balance =
      scope.type === "all"
        ? income - outcome
        : income - outcome + transferIn - transferOut;

    return {
      income,
      outcome,
      balance,
      savingIn,
      savingOut,
      savingNet: savingIn - savingOut,
      prelevements,
      incomeCount,
      outcomeCount,
      prelevementCount,
      savingCount,
      transferCount,
      transferTotal,
      transferIn,
      transferOut,
      categories,
      dailyNet,
    };
  }, [monthData, scope]);

  const categoryOptions = useMemo(() => {
    const keys = Object.keys(periodStats.categories).sort();
    return ["all", ...keys];
  }, [periodStats.categories]);

  useEffect(() => {
    if (categoryFilter === "all") return;
    if (!categoryOptions.includes(categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, categoryOptions]);

  const categoryEntries = useMemo(() => {
    const entries = Object.entries(periodStats.categories).sort((a, b) => b[1] - a[1]);
    if (categoryFilter === "all") return entries;
    return entries.filter(([key]) => key === categoryFilter);
  }, [categoryFilter, periodStats.categories]);

  const categoryTotal = categoryEntries.reduce((sum, [, value]) => sum + value, 0);
  const maxCategoryValue = Math.max(...categoryEntries.map(([, value]) => value), 1);

  const donutTotal = periodStats.income + periodStats.outcome;
  const prelevementValue = Math.min(periodStats.prelevements, periodStats.outcome);
  const outcomeRemainder = Math.max(periodStats.outcome - prelevementValue, 0);
  const incomeRatio = donutTotal ? periodStats.income / donutTotal : 0;
  const prelevementRatio = donutTotal ? prelevementValue / donutTotal : 0;
  const outcomeRatio = donutTotal ? outcomeRemainder / donutTotal : 0;

  const dailyNetEntries = useMemo(() => {
    const year = Number(selectedYear);
    const monthIndex = selectedMonth;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, idx) => {
      const day = String(idx + 1).padStart(2, "0");
      return { day, value: periodStats.dailyNet[day] || 0 };
    });
  }, [periodStats.dailyNet, selectedMonth, selectedYear]);

  const dailyMax = Math.max(
    ...dailyNetEntries.map((entry) => Math.abs(entry.value)),
    1
  );

  const monthlySeries = useMemo(() => {
    const yearData = dataByYear[selectedYear] || Array.from({ length: 12 }, () => []);
    return yearData.map((items) => {
      let income = 0;
      let outcome = 0;
      for (const item of items) {
        if (isSavingTransfer(item)) continue;
        const accountName = getExternalAccount(item);
        if (scope.type !== "all" && accountName !== scope.name) continue;
        const amount = item.amount || 0;
        if (item.type === "income") {
          income += amount;
        } else {
          outcome += amount;
        }
      }
      return { income, outcome };
    });
  }, [dataByYear, scope, selectedYear]);

  const monthMax = Math.max(
    ...monthlySeries.map((m) => Math.max(m.income, m.outcome)),
    1
  );

  const accountDistribution = useMemo(() => {
    const computeNet = (accountName, accountType) => {
      let income = 0;
      let outcome = 0;
      let transferIn = 0;
      let transferOut = 0;
      for (const item of monthData) {
        const amount = item.amount || 0;
        if (isSavingTransfer(item)) {
          const { from, to } = getTransferAccounts(item);
          if (accountType === "current") {
            if (from === accountName) transferOut += amount;
            if (to === accountName) transferIn += amount;
          } else if (accountType === "saving") {
            if (from === accountName) transferOut += amount;
            if (to === accountName) transferIn += amount;
          }
          continue;
        }
        const account = getExternalAccount(item);
        if (account !== accountName) continue;
        if (item.type === "income") income += amount;
        else outcome += amount;
      }
      return income - outcome + transferIn - transferOut;
    };

    return {
      current: accountLists.current.map((name) => ({
        name,
        value: computeNet(name, "current"),
      })),
      saving: accountLists.saving.map((name) => ({
        name,
        value: computeNet(name, "saving"),
      })),
    };
  }, [accountLists, monthData]);

  const distributionMax = Math.max(
    ...[...accountDistribution.current, ...accountDistribution.saving].map((item) =>
      Math.abs(item.value)
    ),
    1
  );

  const savingsEvolution = useMemo(() => {
    const yearData = dataByYear[selectedYear] || Array.from({ length: 12 }, () => []);
    const series = accountLists.saving.map((name) => ({
      name,
      values: yearData.map((items) => {
        let savingIn = 0;
        let savingOut = 0;
        for (const item of items) {
          if (!isSavingTransfer(item)) continue;
          const { from, to } = getTransferAccounts(item);
          const amount = item.amount || 0;
          if (item.type === "outcome" && to === name) savingIn += amount;
          if (item.type === "income" && from === name) savingOut += amount;
        }
        return savingIn - savingOut;
      }),
    }));

    const combined = yearData.map((items) => {
      let savingIn = 0;
      let savingOut = 0;
      for (const item of items) {
        if (!isSavingTransfer(item)) continue;
        const amount = item.amount || 0;
        if (item.type === "outcome") savingIn += amount;
        else savingOut += amount;
      }
      return savingIn - savingOut;
    });

    return { series, combined };
  }, [accountLists.saving, dataByYear, selectedYear]);

  const savingsMax = Math.max(
    ...savingsEvolution.series.flatMap((s) => s.values.map((v) => Math.abs(v))),
    ...savingsEvolution.combined.map((v) => Math.abs(v)),
    1
  );

  const linePoints = (values) =>
    values
      .map((value, index) => {
        const x = (index / 11) * 100;
        const y = 50 - (value / savingsMax) * 40;
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <div className="stats-page">
      <div className="stats-header">
        <div>
          <h2 className="panel-title">Stats</h2>
          <p className="stats-subtitle">
            Monthly and yearly insights from your transactions.
          </p>
        </div>
        <div className="stats-controls">
          <label className="stats-field">
            <span>Year</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="stats-field">
            <span>Month</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="stats-field">
            <span>Scope</span>
            <select value={scopeValue} onChange={(e) => setScopeValue(e.target.value)}>
              {scopeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="stats-field">
            <span>Outcome view</span>
            <select
              value={outcomeView}
              onChange={(e) => setOutcomeView(e.target.value)}
            >
              <option value="amount">EUR</option>
              <option value="percent">%</option>
            </select>
          </label>
          <label className="stats-field">
            <span>Category filter</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All" : category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="stats-grid">
        <section className="panel stats-card stats-hero">
          <div>
            <h3 className="stats-title">Monthly balance</h3>
            <p className="stats-highlight">{formatCurrency(periodStats.balance)}</p>
            <p className="stats-muted">Income minus outcome</p>
          </div>
          <div className="stats-hero-mini">
            <div>
              <span>Income</span>
              <strong className="is-income">
                {formatCurrency(periodStats.income)}
              </strong>
            </div>
            <div>
              <span>Outcome</span>
              <strong className="is-expense">
                {formatCurrency(periodStats.outcome)}
              </strong>
            </div>
          </div>
        </section>

        <section className="panel stats-card stats-donut">
          <h3 className="stats-title">Income vs outcome</h3>
          <div className="donut-chart">
            <svg viewBox="0 0 120 120">
              <circle className="donut-ring" cx="60" cy="60" r="46" />
              <circle
                className="donut-segment income"
                cx="60"
                cy="60"
                r="46"
                strokeDasharray={`${incomeRatio * 289} ${289}`}
              />
              <circle
                className="donut-segment outcome"
                cx="60"
                cy="60"
                r="46"
                strokeDasharray={`${outcomeRatio * 289} ${289}`}
                strokeDashoffset={-(incomeRatio * 289)}
              />
              <circle
                className="donut-segment prelevement"
                cx="60"
                cy="60"
                r="46"
                strokeDasharray={`${prelevementRatio * 289} ${289}`}
                strokeDashoffset={-((incomeRatio + outcomeRatio) * 289)}
              />
            </svg>
            <div className="donut-legend">
              <div>
                <span className="dot income" />
                Income: {formatCurrency(periodStats.income)}
              </div>
              <div>
                <span className="dot outcome" />
                Outcome: {formatCurrency(periodStats.outcome)}
              </div>
              <div>
                <span className="dot prelevement" />
                Prelevements: {formatCurrency(periodStats.prelevements)}
              </div>
            </div>
          </div>
        </section>

        <section className="panel stats-card stats-kpi-grid stats-kpi-counts">
          <div className="stats-kpi">
            <span>Income count</span>
            <strong>{periodStats.incomeCount}</strong>
          </div>
          <div className="stats-kpi">
            <span>Outcome count</span>
            <strong>{periodStats.outcomeCount}</strong>
          </div>
          <div className="stats-kpi">
            <span>Prelevements count</span>
            <strong>{periodStats.prelevementCount}</strong>
          </div>
          <div className="stats-kpi">
            <span>Saving count</span>
            <strong>{periodStats.savingCount}</strong>
          </div>
          <div className="stats-kpi">
            <span>Transfer count</span>
            <strong>{periodStats.transferCount}</strong>
          </div>
        </section>

        <section className="panel stats-card stats-kpi-grid stats-kpi-totals">
          <div className="stats-kpi">
            <span>Total income</span>
            <strong className="is-income">{formatCurrency(periodStats.income)}</strong>
          </div>
          <div className="stats-kpi">
            <span>Total outcome</span>
            <strong className="is-expense">{formatCurrency(periodStats.outcome)}</strong>
          </div>
          <div className="stats-kpi">
            <span>Total prelevements</span>
            <strong className="is-prelevement">
              {formatCurrency(periodStats.prelevements)}
            </strong>
          </div>
          <div className="stats-kpi">
            <span>Total transfers</span>
            <strong>{formatCurrency(periodStats.transferTotal)}</strong>
          </div>
          <div className="stats-kpi">
            <span>Saving net</span>
            <strong>{formatCurrency(periodStats.savingNet)}</strong>
          </div>
        </section>

        <section className="panel stats-card stats-mini">
          <h3 className="stats-title">Daily net flow</h3>
          <div className="sparkline">
            {dailyNetEntries.map((entry) => (
              <div key={entry.day} className="spark-bar">
                <span
                  className={entry.value >= 0 ? "bar-income" : "bar-expense"}
                  style={{
                    height: `${(Math.abs(entry.value) / dailyMax) * 100}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="sparkline-legend">
            <span>1</span>
            <span>{dailyNetEntries.length}</span>
          </div>
        </section>

        <section className="panel stats-card stats-mini">
          <h3 className="stats-title">Savings evolution</h3>
          <div className="line-chart-mini">
            <svg viewBox="0 0 100 60" preserveAspectRatio="none">
              {savingsEvolution.series.map((series, index) => (
                <polyline
                  key={series.name}
                  className={`line-path mini-line line-${index % 4}`}
                  points={linePoints(series.values)}
                />
              ))}
              <polyline
                className="line-path mini-line line-combined"
                points={linePoints(savingsEvolution.combined)}
              />
            </svg>
          </div>
          <div className="line-legend">
            <span>Jan</span>
            <span>Dec</span>
          </div>
        </section>

        <section className="panel stats-card stats-full">
          <h3 className="stats-title">Income vs outcome by month</h3>
          <div className="month-chart">
            {monthlySeries.map((item, index) => (
              <div key={MONTHS[index]} className="month-col">
                <div className="month-bars">
                  <span
                    className="month-bar income"
                    style={{ height: `${(item.income / monthMax) * 100}%` }}
                  />
                  <span
                    className="month-bar outcome"
                    style={{ height: `${(item.outcome / monthMax) * 100}%` }}
                  />
                </div>
                <span className="month-label">{MONTHS[index].slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stats-card stats-full">
          <h3 className="stats-title">Outcome by category</h3>
          {categoryEntries.length ? (
            <div className="bar-chart">
              {categoryEntries.map(([category, value]) => {
                const displayValue =
                  outcomeView === "percent"
                    ? `${((value / (categoryTotal || 1)) * 100).toFixed(1)}%`
                    : formatCurrency(value);
                const width =
                  outcomeView === "percent"
                    ? (value / (categoryTotal || 1)) * 100
                    : (value / maxCategoryValue) * 100;
                return (
                  <div className="bar-row" key={category}>
                    <span className="bar-label">{category}</span>
                    <div className="bar-track">
                      <div
                        className="bar bar-expense"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="bar-value">{displayValue}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="stats-empty">No outcome transactions for this month.</p>
          )}
        </section>

        {scope.type === "all" && (
          <section className="panel stats-card stats-full">
            <h3 className="stats-title">Account distribution (net change)</h3>
            <div className="distribution-grid">
              <div>
                <h4>Current accounts</h4>
                {accountDistribution.current.length ? (
                  <div className="distribution-list">
                    {accountDistribution.current.map((item) => (
                      <div key={item.name} className="distribution-row">
                        <span>{item.name}</span>
                        <div className="distribution-track">
                          <span
                            className={`distribution-bar ${
                              item.value >= 0 ? "positive" : "negative"
                            }`}
                            style={{
                              width: `${(Math.abs(item.value) / distributionMax) * 100}%`,
                            }}
                          />
                        </div>
                        <span>{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="stats-empty">No current accounts.</p>
                )}
              </div>
              <div>
                <h4>Saving accounts</h4>
                {accountDistribution.saving.length ? (
                  <div className="distribution-list">
                    {accountDistribution.saving.map((item) => (
                      <div key={item.name} className="distribution-row">
                        <span>{item.name}</span>
                        <div className="distribution-track">
                          <span
                            className={`distribution-bar ${
                              item.value >= 0 ? "positive" : "negative"
                            }`}
                            style={{
                              width: `${(Math.abs(item.value) / distributionMax) * 100}%`,
                            }}
                          />
                        </div>
                        <span>{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="stats-empty">No saving accounts.</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
