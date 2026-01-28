import React, { useEffect, useMemo, useState } from "react";
import "./TransactionList.css";

const categories = [
  "Restaurant",
  "Groceries",
  "Transport",
  "Rent",
  "Health",
  "Entertainment",
  "Travel",
  "Subscriptions",
  "Bills",
  "Education/Work",
  "Gifts/Donations",
  "Salary",
  "Transfer",
  "Saving",
  "Other",
];

export default function TransactionList({
  transactions,
  limit = 4,
  onUpdate,
  onDelete,
  currentAccounts = [],
  savingAccounts = [],
  scope,
  language = "fr",
}) {
  const labels = {
    fr: {
      empty: "Aucune transaction pour le moment.",
      namePlaceholder: "Nom de la transaction",
      amountPlaceholder: "Montant",
      outcome: "Dépense",
      income: "Revenu",
      prelevement: "Prélèvement",
      cancel: "Annuler",
      delete: "Supprimer",
      save: "Enregistrer",
      edit: "Modifier",
      current: "Courant",
      savings: "Épargne",
      categories: {
        Restaurant: "Restaurant",
        Groceries: "Courses",
        Transport: "Transport",
        Bills: "Factures",
        Rent: "Loyer",
        Health: "Santé",
        Entertainment: "Loisirs",
        Travel: "Voyage",
        Subscriptions: "Abonnements",
        "Education/Work": "Éducation/Travail",
        "Gifts/Donations": "Cadeaux/Donations",
        Salary: "Salaire",
        Other: "Autre",
        Transfer: "Virement",
        Saving: "Épargne",
      },
    },
    en: {
      empty: "No transactions yet.",
      namePlaceholder: "Transaction name",
      amountPlaceholder: "Amount",
      outcome: "Outcome",
      income: "Income",
      prelevement: "Direct Debit",
      cancel: "Cancel",
      delete: "Delete",
      save: "Save",
      edit: "Edit",
      current: "Current",
      savings: "Savings",
      categories: {
        Restaurant: "Restaurant",
        Groceries: "Groceries",
        Transport: "Transport",
        Bills: "Bills",
        Rent: "Rent",
        Health: "Health",
        Entertainment: "Entertainment",
        Travel: "Travel",
        Subscriptions: "Subscriptions",
        "Education/Work": "Education/Work",
        "Gifts/Donations": "Gifts/Donations",
        Salary: "Salary",
        Other: "Other",
        Transfer: "Transfer",
        Saving: "Saving",
      },
    },
  };
  const i18n = labels[language] || labels.fr;

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
    transferAccount: "",
  });

  const visibleTransactions =
    typeof limit === "number" ? transactions.slice(0, limit) : transactions;
  const editingTransaction = useMemo(
    () => transactions.find((item) => item.id === editingId),
    [transactions, editingId]
  );

  useEffect(() => {
    if (formState.category !== "Transfer") return;
    if (!currentAccounts.length) return;
    if (formState.transferAccount === formState.currentAccount) {
      const fallback =
        currentAccounts.find((acc) => acc !== formState.currentAccount) || "";
      setFormState((prev) => ({
        ...prev,
        transferAccount: fallback,
      }));
    }
  }, [
    formState.category,
    formState.currentAccount,
    formState.transferAccount,
    currentAccounts,
  ]);

  if (!transactions.length) {
    return (
      <div className="transaction-list-empty">{i18n.empty}</div>
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
      transferAccount:
        transaction.transferAccount ||
        currentAccounts[0] ||
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
    if (formState.category === "Transfer" && !formState.transferAccount) return;
    const finalType = formState.isPrelevement ? "expense" : formState.type;
    const resolvedCurrent =
      formState.currentAccount || currentAccounts[0] || "Current account";
    const resolvedSaving = formState.savingAccount || savingAccounts[0] || "";
    const resolvedTransfer = formState.transferAccount || currentAccounts[0] || "";
    const accountName =
      formState.category === "Saving" ? resolvedSaving : resolvedCurrent;
    const accountType = formState.category === "Saving" ? "saving" : "current";
    const updated = {
      ...editingTransaction,
      name: formState.name,
      amount: Math.abs(parsedAmount),
      category: formState.category,
      type: finalType,
      isPrelevement:
        formState.category === "Transfer" ? false : formState.isPrelevement,
      currentAccount: resolvedCurrent,
      savingAccount: resolvedSaving,
      transferAccount: resolvedTransfer,
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
    return dt.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US");
  };

  const formatAmount = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "0.00";
    return num.toFixed(2);
  };

  return (
    <ul className="transaction-list">
      {visibleTransactions.map((t, i) => {
        let displayType = t.type;
        if (t.category === "Transfer" && scope?.type === "current" && scope?.name) {
          if (t.transferAccount === scope.name) displayType = "income";
          if (t.currentAccount === scope.name) displayType = "expense";
        }
        return (
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
                  placeholder={i18n.namePlaceholder}
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
                  placeholder={i18n.amountPlaceholder}
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
                        transferAccount:
                          next === "Transfer"
                            ? currentAccounts[0] || ""
                            : prev.transferAccount,
                        isPrelevement:
                          next === "Transfer" ? false : prev.isPrelevement,
                      };
                    })
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {i18n.categories[cat] || cat}
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
              {formState.category === "Transfer" && (
                <div className="edit-row">
                  <select
                    value={formState.transferAccount}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        transferAccount: e.target.value,
                      }))
                    }
                  >
                    {(currentAccounts.length ? currentAccounts : ["Current account"])
                      .filter((account) => account !== formState.currentAccount)
                      .map((account) => (
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
                      {i18n.outcome}
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
                      {i18n.income}
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
                    disabled={formState.category === "Transfer"}
                  />
                  <span className="edit-prelevement-pill" aria-hidden="true">
                    <span className="edit-prelevement-dot" />
                  </span>
                  <span className="edit-prelevement-text">{i18n.prelevement}</span>
                </label>
              </div>
              <div className="edit-actions">
                <button type="button" onClick={cancelEdit}>
                  {i18n.cancel}
                </button>
                <button type="button" className="edit-delete" onClick={deleteEdit}>
                  {i18n.delete}
                </button>
                <button type="button" onClick={saveEdit}>
                  {i18n.save}
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
                        : displayType === "income"
                        ? "is-income"
                        : "is-expense"
                    }`}
                  >
                    {displayType === "income" ? "+" : "-"}
                    {formatAmount(t.amount)} EUR
                  </span>
                  <span className="transaction-date">
                    {formatDate(t.date)}
                  </span>
                </div>
              </div>
              <div className="transaction-meta">
                <span className="transaction-category">
                  {i18n.categories[t.category] || t.category}
                </span>
                {t.isPrelevement && (
                  <span className="transaction-prelevement">{i18n.prelevement}</span>
                )}
                {!t.isPrelevement && (
                  <span
                    className={`transaction-type ${
                      displayType === "income" ? "is-income" : "is-expense"
                    }`}
                  >
                    {displayType === "income" ? i18n.income : i18n.outcome}
                  </span>
                )}
                {t.category !== "Saving" && t.category !== "Transfer" && (t.currentAccount || t.accountName) && (
                  <span className="transaction-account">
                    {t.currentAccount || t.accountName}
                  </span>
                )}
                {t.category === "Saving" && (
                  <span className="transaction-transfer">
                    {t.type === "income"
                      ? `${t.savingAccount || t.accountName || i18n.savings} → ${t.currentAccount || currentAccounts[0] || i18n.current}`
                      : `${t.currentAccount || currentAccounts[0] || i18n.current} → ${t.savingAccount || t.accountName || i18n.savings}`}
                  </span>
                )}
                {t.category === "Transfer" && (
                  <span className="transaction-transfer">
                    {t.type === "income"
                      ? `${t.transferAccount || i18n.current} → ${t.currentAccount || currentAccounts[0] || i18n.current}`
                      : `${t.currentAccount || currentAccounts[0] || i18n.current} → ${t.transferAccount || i18n.current}`}
                  </span>
                )}
                {onUpdate && (
                  <button
                    type="button"
                    className="transaction-edit"
                    onClick={() => startEdit(t)}
                  >
                    {i18n.edit}
                  </button>
                )}
              </div>
            </>
          )}
        </li>
        );
      })}
    </ul>
  );
}
