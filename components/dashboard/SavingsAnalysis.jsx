import React from "react";
import "./SavingsAnalysis.css";

const formatCurrency = (value) => `${value.toFixed(2)} EUR`;

export default function SavingsAnalysis({
  savingsByAccount,
  maskAmounts = false,
  language = "fr",
}) {
  const labels = {
    fr: {
      title: "Épargne par compte",
      empty: "Aucun transfert d'épargne",
      deposits: "Dépôts",
      withdrawals: "Retraits",
    },
    en: {
      title: "Savings by Account",
      empty: "No savings transfers",
      deposits: "Deposits",
      withdrawals: "Withdrawals",
    },
  };
  const t = labels[language] || labels.fr;

  if (!savingsByAccount || savingsByAccount.length === 0) {
    return (
      <div className="savings-analysis">
        <h4 className="chart-title">{t.title}</h4>
        <div className="chart-empty">{t.empty}</div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...savingsByAccount.map((acc) => Math.max(acc.deposits, acc.withdrawals))
  );
  const renderCurrency = (value) =>
    maskAmounts ? "***** EUR" : formatCurrency(value);

  return (
    <div className="savings-analysis">
      <h4 className="chart-title">{t.title}</h4>
      <div className="savings-bars">
        {savingsByAccount.map((account) => {
          const depositPercent = maxValue > 0 ? (account.deposits / maxValue) * 100 : 0;
          const withdrawalPercent = maxValue > 0 ? (account.withdrawals / maxValue) * 100 : 0;

          return (
            <div key={account.name} className="savings-account-item">
              <div className="savings-account-header">
                <span className="savings-account-name">{account.name}</span>
                <span
                  className={`savings-net-change ${
                    account.netChange >= 0 ? "positive" : "negative"
                  }`}
                >
                  {!maskAmounts && account.netChange >= 0 ? "+" : ""}
                  {renderCurrency(account.netChange)}
                </span>
              </div>
              <div className="savings-bars-pair">
                <div className="savings-bar-row">
                  <span className="savings-bar-label">{t.deposits}</span>
                  <div className="savings-bar-track">
                    <div
                      className="savings-bar-fill savings-bar-deposit"
                      style={{ width: `${depositPercent}%` }}
                    />
                  </div>
                  <span className="savings-bar-value">{renderCurrency(account.deposits)}</span>
                </div>
                <div className="savings-bar-row">
                  <span className="savings-bar-label">{t.withdrawals}</span>
                  <div className="savings-bar-track">
                    <div
                      className="savings-bar-fill savings-bar-withdrawal"
                      style={{ width: `${withdrawalPercent}%` }}
                    />
                  </div>
                  <span className="savings-bar-value">{renderCurrency(account.withdrawals)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
