import React from "react";
import KPICard from "./KPICard";
import "./KPISection.css";

const formatCurrency = (value) =>
  `${Number.isFinite(value) ? value.toFixed(2) : "0.00"} EUR`;

const formatPercentage = (value) =>
  Number.isFinite(value) ? value.toFixed(1) : "0.0";

export default function KPISection({ kpis }) {
  return (
    <div className="kpi-section">
      <h3 className="kpi-section-title">Key Metrics</h3>
      <div className="kpi-grid">
        <KPICard
          label="Current Balance"
          value={formatCurrency(kpis.currentBalance)}
          variant="balance"
          meta="All current accounts"
        />
        <KPICard
          label="Savings Balance"
          value={formatCurrency(kpis.savingsBalance)}
          variant="balance"
          meta="All savings accounts"
        />
        <KPICard
          label="Total Balance"
          value={formatCurrency(kpis.totalBalance)}
          variant="balance"
          meta="Current + Savings"
        />
        
        <KPICard
          label="Real Income"
          value={formatCurrency(kpis.realIncome)}
          variant="income"
          count={kpis.realIncomeCount}
          meta="External income only"
        />
        <KPICard
          label="Real Outcome"
          value={formatCurrency(kpis.realOutcome)}
          variant="expense"
          count={kpis.realOutcomeCount}
          meta="External expenses only"
        />
        <KPICard
          label="Real Net"
          value={formatCurrency(kpis.realNet)}
          variant={kpis.realNet >= 0 ? "positive" : "negative"}
          percentage={kpis.realIncome > 0 ? formatPercentage((kpis.realNet / kpis.realIncome) * 100) : undefined}
          meta="Income - Outcome"
        />

        <KPICard
          label="Savings Deposits"
          value={formatCurrency(kpis.savingsDeposits)}
          variant="default"
          count={kpis.savingsDepositsCount}
          meta="Money moved to savings"
        />
        <KPICard
          label="Savings Withdrawals"
          value={formatCurrency(kpis.savingsWithdrawals)}
          variant="default"
          count={kpis.savingsWithdrawalsCount}
          meta="Money taken from savings"
        />
        <KPICard
          label="Savings Net Change"
          value={formatCurrency(kpis.savingsNetChange)}
          variant={kpis.savingsNetChange >= 0 ? "positive" : "negative"}
          meta="Deposits - Withdrawals"
        />

        <KPICard
          label="Prelevements"
          value={formatCurrency(kpis.prelevTotal)}
          variant="prelevement"
          count={kpis.prelevCount}
          percentage={kpis.realOutcome > 0 ? formatPercentage((kpis.prelevTotal / kpis.realOutcome) * 100) : undefined}
          meta="Automatic payments"
        />
        <KPICard
          label="Savings Rate"
          value={`${formatPercentage(kpis.savingsRate)}%`}
          variant="positive"
          meta="Savings / Income"
        />
      </div>
    </div>
  );
}
