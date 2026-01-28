import React from "react";
import KPICard from "./KPICard";
import "./KPISection.css";

const formatCurrency = (value) =>
  `${Number.isFinite(value) ? value.toFixed(2) : "0.00"} EUR`;

const formatPercentage = (value) =>
  Number.isFinite(value) ? value.toFixed(1) : "0.0";

export default function KPISection({ kpis, language = "fr" }) {
  const labels = {
    fr: {
      title: "Indicateurs clés",
      currentBalance: "Solde courant total",
      savingBalance: "Solde épargne total",
      incomes: "Total des revenus",
      expenses: "Total des dépenses",
      expensesNoPrelev: "Total des dépenses (hors prélèvements)",
      prelevements: "Total des prélèvements",
    },
    en: {
      title: "Key Metrics",
      currentBalance: "Total Current Balance",
      savingBalance: "Total Saving Balance",
      incomes: "Total Incomes",
      expenses: "Total Expenses",
      expensesNoPrelev: "Total Expenses (no direct debit)",
      prelevements: "Total Direct Debits",
    },
  };
  const t = labels[language] || labels.fr;
  const totalBalance = kpis.currentBalance + kpis.savingsBalance;
  const totalFlow = kpis.realIncome + kpis.realOutcome;

  const currentBalancePct =
    totalBalance !== 0 ? formatPercentage((kpis.currentBalance / totalBalance) * 100) : undefined;
  const savingsBalancePct =
    totalBalance !== 0 ? formatPercentage((kpis.savingsBalance / totalBalance) * 100) : undefined;
  const incomePct =
    totalFlow > 0 ? formatPercentage((kpis.realIncome / totalFlow) * 100) : undefined;
  const outcomePct =
    totalFlow > 0 ? formatPercentage((kpis.realOutcome / totalFlow) * 100) : undefined;
  const expenseNoPrelev = kpis.realOutcome - kpis.prelevTotal;
  const expenseNoPrelevPct =
    totalFlow > 0 ? formatPercentage((expenseNoPrelev / totalFlow) * 100) : undefined;
  const prelevPct =
    kpis.realOutcome > 0 ? formatPercentage((kpis.prelevTotal / kpis.realOutcome) * 100) : undefined;

  return (
    <div className="kpi-section">
      <h3 className="kpi-section-title">{t.title}</h3>
      <div className="kpi-grid">
        <KPICard
          label={t.currentBalance}
          value={formatCurrency(kpis.currentBalance)}
          variant="balance"
          count={kpis.realIncomeCount + kpis.realOutcomeCount + kpis.prelevCount}
          percentage={currentBalancePct}
        />
        <KPICard
          label={t.savingBalance}
          value={formatCurrency(kpis.savingsBalance)}
          variant="balance"
          count={kpis.savingsDepositsCount + kpis.savingsWithdrawalsCount}
          percentage={savingsBalancePct}
        />
        
        <KPICard
          label={t.incomes}
          value={formatCurrency(kpis.realIncome)}
          variant="income"
          count={kpis.realIncomeCount}
          percentage={incomePct}
        />
        <KPICard
          label={t.expenses}
          value={formatCurrency(kpis.realOutcome)}
          variant="expense"
          percentage={outcomePct}
        />

        <KPICard
          label={t.expensesNoPrelev}
          value={formatCurrency(expenseNoPrelev)}
          variant="expense"
          count={kpis.realOutcomeCount}
          percentage={expenseNoPrelevPct}
        />

        <KPICard
          label={t.prelevements}
          value={formatCurrency(kpis.prelevTotal)}
          variant="prelevement"
          count={kpis.prelevCount}
          percentage={prelevPct}
        />
      </div>
    </div>
  );
}
