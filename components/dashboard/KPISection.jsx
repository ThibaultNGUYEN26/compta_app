import React from "react";
import KPICard from "./KPICard";
import "./KPISection.css";

const formatCurrency = (value) =>
  `${Number.isFinite(value) ? value.toFixed(2) : "0.00"} EUR`;

const formatPercentage = (value) =>
  Number.isFinite(value) ? value.toFixed(1) : "0.0";

export default function KPISection({ kpis }) {
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
      <h3 className="kpi-section-title">Key Metrics</h3>
      <div className="kpi-grid">
        <KPICard
          label="Total Current Balance"
          value={formatCurrency(kpis.currentBalance)}
          variant="balance"
          count={kpis.realIncomeCount + kpis.realOutcomeCount + kpis.prelevCount}
          percentage={currentBalancePct}
        />
        <KPICard
          label="Total Saving Balance"
          value={formatCurrency(kpis.savingsBalance)}
          variant="balance"
          count={kpis.savingsDepositsCount + kpis.savingsWithdrawalsCount}
          percentage={savingsBalancePct}
        />
        
        <KPICard
          label="Total Incomes"
          value={formatCurrency(kpis.realIncome)}
          variant="income"
          count={kpis.realIncomeCount}
          percentage={incomePct}
        />
        <KPICard
          label="Total Expenses"
          value={formatCurrency(kpis.realOutcome)}
          variant="expense"
          percentage={outcomePct}
        />

        <KPICard
          label="Total Expenses (no prelev.)"
          value={formatCurrency(expenseNoPrelev)}
          variant="expense"
          count={kpis.realOutcomeCount}
          percentage={expenseNoPrelevPct}
        />

        <KPICard
          label="Total Prelevements"
          value={formatCurrency(kpis.prelevTotal)}
          variant="prelevement"
          count={kpis.prelevCount}
          percentage={prelevPct}
        />
      </div>
    </div>
  );
}
