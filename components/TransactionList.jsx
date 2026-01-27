import React, { useMemo, useState } from "react";
import "./TransactionList.css";

const categories = [
  "Restaurant",
  "Groceries",
  "Transport",
  "Shopping",
  "Bills",
  "Utilities",
  "Housing",
  "Health",
  "Entertainment",
  "Travel",
  "Subscriptions",
  "Other",
  "Saving",
];

export default function TransactionList({
  transactions,
  limit = 4,
  onUpdate,
  onDelete,
  currentAccounts = [],
  savingAccounts = [],
}) {
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [formState, setFormState] = useState({
    name: "",
    amount: "",
    category: categories[0],
    type: "expense",
    isPrelevement: false,
    date: "",
    accountName: "",
    currentAccount: "",
    savingAccount: "",
  });

  const visibleTransactions =
    typeof limit === "number" ? transactions.slice(0, limit) : transactions;
  const editingTransaction = useMemo(
    () => transactions.find((item) => item.id === editingId),
    [transactions, editingId]
  );

  if (!transactions.length) {
    return (
      <div className="transaction-list-empty">No transactions yet.</div>
    );
  }

  const startEdit = (transaction) => {
    setEditingId(transaction.id);
    setFormState({
      name: transaction.name || "",
      amount:
        typeof transaction.amount === "number"
          ? String(transaction.amount)
          : transaction.amount || "",
      category: transaction.category || categories[0],
      type: transaction.type || "expense",
      isPrelevement: Boolean(transaction.isPrelevement),
      accountName: transaction.accountName || "",
      currentAccount:
        transaction.currentAccount ||
        currentAccounts[0] ||
        "Current account",
      savingAccount:
        transaction.savingAccount ||
        savingAccounts[0] ||
        "",
      date: transaction.date
        ? new Date(transaction.date).toISOString().slice(0, 10)
        : "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const deleteEdit = () => {
    if (!editingTransaction) return;
    onDelete?.(editingTransaction.id);
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editingTransaction) return;
    const parsedAmount = parseFloat(formState.amount);
    if (!formState.name || Number.isNaN(parsedAmount)) return;
    if (formState.category === "Saving" && !formState.savingAccount) return;
    const finalType = formState.isPrelevement ? "expense" : formState.type;
    const resolvedCurrent =
      formState.currentAccount || currentAccounts[0] || "Current account";
    const resolvedSaving = formState.savingAccount || savingAccounts[0] || "";
    const accountName =
      formState.category === "Saving" ? resolvedSaving : resolvedCurrent;
    const accountType = formState.category === "Saving" ? "saving" : "current";
    const updated = {
      ...editingTransaction,
      name: formState.name,
      amount: Math.abs(parsedAmount),
      category: formState.category,
      type: finalType,
      isPrelevement: formState.isPrelevement,
      currentAccount: resolvedCurrent,
      savingAccount: resolvedSaving,
      accountType,
      accountName,
      date: formState.date
        ? new Date(formState.date).toISOString()
        : editingTransaction.date,
    };
    onUpdate?.(updated);
    setEditingId(null);
  };

  const formatDate = (value) => {
    if (!value) return "";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString();
  };

  const formatAmount = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "0.00";
    return num.toFixed(2);
  };

  return (
    <ul className="transaction-list">
      {visibleTransactions.map((t, i) => (
        <li 
          key={t.id || i} 
          className={`transaction-item ${selectedId === t.id ? 'transaction-item-selected' : ''}`}
          onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
        >
          {editingId === t.id ? (
            <div className="transaction-edit-form">
              <div className="edit-row">
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Transaction name"
                />
                <input
                  type="number"
                  value={formState.amount}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                />
              </div>
              <div className="edit-row">
                <input
                  type="date"
                  value={formState.date}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
                <select
                  value={formState.category}
                  onChange={(e) =>
                    setFormState((prev) => {
                      const next = e.target.value;
                      return {
                        ...prev,
                        category: next,
                        accountName:
                          next === "Saving"
                            ? savingAccounts[0] || ""
                            : prev.accountName,
                        savingAccount:
                          next === "Saving"
                            ? savingAccounts[0] || ""
                            : prev.savingAccount,
                      };
                    })
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              {formState.category === "Saving" && (
                <div className="edit-row">
                  <select
                    value={formState.savingAccount}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        savingAccount: e.target.value,
                      }))
                    }
                  >
                    {savingAccounts.map((account) => (
                      <option key={account} value={account}>
                        {account}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="edit-row edit-toggles">
                <label className="edit-type-toggle">
                  <span className="edit-toggle-side">
                    <span
                      className={formState.type === "expense" ? "is-active" : ""}
                    >
                      Outcome
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={formState.type === "income"}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        type: e.target.checked ? "income" : "expense",
                      }))
                    }
                    disabled={formState.isPrelevement}
                  />
                  <span className="edit-toggle-track" aria-hidden="true">
                    <span className="edit-toggle-thumb" />
                  </span>
                  <span className="edit-toggle-side">
                    <span
                      className={formState.type === "income" ? "is-active" : ""}
                    >
                      Income
                    </span>
                  </span>
                </label>
                <label className="edit-prelevement-toggle">
                  <input
                    type="checkbox"
                    checked={formState.isPrelevement}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setFormState((prev) => ({
                        ...prev,
                        isPrelevement: next,
                        type: next ? "expense" : prev.type,
                      }));
                    }}
                  />
                  <span className="edit-prelevement-pill" aria-hidden="true">
                    <span className="edit-prelevement-dot" />
                  </span>
                  <span className="edit-prelevement-text">Prelevement</span>
                </label>
              </div>
              <div className="edit-actions">
                <button type="button" onClick={cancelEdit}>
                  Cancel
                </button>
                <button type="button" className="edit-delete" onClick={deleteEdit}>
                  Delete
                </button>
                <button type="button" onClick={saveEdit}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="transaction-main">
                <span className="transaction-name">{t.name}</span>
                <div className="transaction-amount-block">
                  <span
                    className={`transaction-amount ${
                      t.isPrelevement
                        ? "is-prelevement"
                        : t.type === "income"
                        ? "is-income"
                        : "is-expense"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatAmount(t.amount)} EUR
                  </span>
                  <span className="transaction-date">
                    {formatDate(t.date)}
                  </span>
                </div>
              </div>
              <div className="transaction-meta">
                <span className="transaction-category">{t.category}</span>
                {t.isPrelevement && (
                  <span className="transaction-prelevement">Prelevement</span>
                )}
                {!t.isPrelevement && (
                  <span
                    className={`transaction-type ${
                      t.type === "income" ? "is-income" : "is-expense"
                    }`}
                  >
                    {t.type === "income" ? "Income" : "Outcome"}
                  </span>
                )}
                {t.category !== "Saving" && (t.currentAccount || t.accountName) && (
                  <span className="transaction-account">
                    {t.currentAccount || t.accountName}
                  </span>
                )}
                {t.category === "Saving" && (
                  <span className="transaction-transfer">
                    {t.type === "income"
                      ? `${t.savingAccount || t.accountName || "Savings"} → ${t.currentAccount || currentAccounts[0] || "Current"}`
                      : `${t.currentAccount || currentAccounts[0] || "Current"} → ${t.savingAccount || t.accountName || "Savings"}`}
                  </span>
                )}
                {onUpdate && (
                  <button
                    type="button"
                    className="transaction-edit"
                    onClick={() => startEdit(t)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
