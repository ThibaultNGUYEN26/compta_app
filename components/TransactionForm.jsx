import React, { useEffect, useState } from "react";
import "./TransactionForm.css";

const categories = [
  "Restaurant",
  "Groceries",
  "Transport",
  "Bills",
  "Rent",
  "Health",
  "Entertainment",
  "Travel",
  "Subscriptions",
  "Education/Work",
  "Gifts/Donations",
  "Salary",
  "Other",
  "Transfer",
  "Saving",
];

export default function TransactionForm({
  onSubmit,
  initialValues,
  onCancel,
  currentAccounts = [],
  savingAccounts = [],
  selectedCurrentAccount,
  language = "fr",
}) {
  const labels = {
    fr: {
      dateLabel: "Date",
      namePlaceholder: "Nom de la transaction",
      amountPlaceholder: "Montant",
      typeLabel: "Type",
      outcome: "Dépense",
      income: "Revenu",
      prelevement: "Prélèvement",
      cancel: "Annuler",
      update: "Mettre à jour",
      add: "Ajouter",
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
      dateLabel: "Date",
      namePlaceholder: "Transaction name",
      amountPlaceholder: "Amount",
      typeLabel: "Type",
      outcome: "Outcome",
      income: "Income",
      prelevement: "Direct Debit",
      cancel: "Cancel",
      update: "Update",
      add: "Add",
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
  const t = labels[language] || labels.fr;

  const today = new Date().toISOString().slice(0, 10);
  const safeInitial = initialValues || {};
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [type, setType] = useState("expense");
  const [isPrelevement, setIsPrelevement] = useState(false);
  const [date, setDate] = useState(today);
  const [savingAccount, setSavingAccount] = useState(
    savingAccounts[0] || ""
  );
  const [transferAccount, setTransferAccount] = useState(
    currentAccounts[0] || ""
  );
  const [currentAccount, setCurrentAccount] = useState(
    selectedCurrentAccount || currentAccounts[0] || "Current account"
  );

  useEffect(() => {
    if (category !== "Transfer") return;
    if (!currentAccounts.length) return;
    if (transferAccount === currentAccount) {
      const fallback =
        currentAccounts.find((acc) => acc !== currentAccount) || "";
      setTransferAccount(fallback);
    }
  }, [category, currentAccount, currentAccounts, transferAccount]);

  useEffect(() => {
    if (!initialValues) {
      setName("");
      setAmount("");
      setCategory(categories[0]);
      setType("expense");
      setIsPrelevement(false);
      setDate(today);
      setSavingAccount(savingAccounts[0] || "");
      setTransferAccount(currentAccounts[0] || "");
      setCurrentAccount(
        selectedCurrentAccount || currentAccounts[0] || "Current account"
      );
      return;
    }
    setName(safeInitial.name || "");
    setAmount(
      typeof safeInitial.amount === "number"
        ? String(safeInitial.amount)
        : safeInitial.amount || ""
    );
    setCategory(safeInitial.category || categories[0]);
    setType(safeInitial.type || "expense");
    setIsPrelevement(Boolean(safeInitial.isPrelevement));
    setSavingAccount(
      safeInitial.savingAccount ||
        safeInitial.accountName ||
        savingAccounts[0] ||
        ""
    );
    setTransferAccount(
      safeInitial.transferAccount ||
        currentAccounts[0] ||
        ""
    );
    setCurrentAccount(
      safeInitial.currentAccount ||
        selectedCurrentAccount ||
        currentAccounts[0] ||
        "Current account"
    );
    if (safeInitial.date) {
      setDate(new Date(safeInitial.date).toISOString().slice(0, 10));
    } else {
      setDate(today);
    }
  }, [currentAccounts, initialValues, savingAccounts, selectedCurrentAccount, today]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name || Number.isNaN(parsedAmount)) return;
    if (category === "Saving" && !savingAccount) return;
    if (category === "Transfer" && !transferAccount) return;
    const finalType = isPrelevement ? "expense" : type;
    const resolvedCurrent = currentAccount || currentAccounts[0] || "Current account";
    const resolvedSaving = savingAccount || savingAccounts[0] || "";
    const resolvedTransfer = transferAccount || currentAccounts[0] || "";
    const accountName =
      category === "Saving" ? resolvedSaving : resolvedCurrent;
    const accountType = category === "Saving" ? "saving" : "current";
    onSubmit({
      ...safeInitial,
      name,
      amount: Math.abs(parsedAmount),
      category,
      type: finalType,
      isPrelevement: category === "Transfer" ? false : isPrelevement,
      currentAccount: resolvedCurrent,
      savingAccount: resolvedSaving,
      transferAccount: resolvedTransfer,
      accountType,
      accountName,
      date: new Date(date).toISOString(),
    });
    if (!initialValues) {
      setName("");
      setAmount("");
      setCategory(categories[0]);
      setType("expense");
      setIsPrelevement(false);
      setDate(today);
      setSavingAccount(savingAccounts[0] || "");
      setTransferAccount(currentAccounts[0] || "");
      setCurrentAccount(
        selectedCurrentAccount || currentAccounts[0] || "Current account"
      );
    }
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        type="text"
        placeholder={t.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        placeholder={t.amountPlaceholder}
        value={amount}
        min="0"
        step="0.01"
        onChange={(e) => setAmount(e.target.value)}
      />
      <select
        value={category}
        onChange={(e) => {
          const next = e.target.value;
          setCategory(next);
          if (next === "Saving") {
            setSavingAccount(savingAccounts[0] || "");
          }
          if (next === "Transfer") {
            setTransferAccount(currentAccounts[0] || "");
            setIsPrelevement(false);
          }
        }}
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {t.categories[cat] || cat}
          </option>
        ))}
      </select>
      {category === "Saving" && (
        <select
          value={savingAccount}
          onChange={(e) => setSavingAccount(e.target.value)}
        >
          {savingAccounts.map((account) => (
            <option key={account} value={account}>
              {account}
            </option>
          ))}
        </select>
      )}
      {category === "Transfer" && (
        <select
          value={transferAccount}
          onChange={(e) => setTransferAccount(e.target.value)}
        >
          {currentAccounts
            .filter((account) => account !== currentAccount)
            .map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
        </select>
      )}
      <div className="transaction-type">
        <span className="transaction-type-label">{t.typeLabel}</span>
        <label className="type-toggle">
          <span className="type-toggle-side">
            <span className={type === "expense" ? "is-active" : ""}>
              {t.outcome}
            </span>
          </span>
          <input
            type="checkbox"
            checked={type === "income"}
            onChange={(e) => setType(e.target.checked ? "income" : "expense")}
            disabled={isPrelevement}
          />
          <span className="type-toggle-track" aria-hidden="true">
            <span className="type-toggle-thumb" />
          </span>
          <span className="type-toggle-side">
            <span className={type === "income" ? "is-active" : ""}>
              {t.income}
            </span>
          </span>
        </label>
      </div>
      <label className="prelevement-toggle">
        <input
          type="checkbox"
          checked={isPrelevement}
          onChange={(e) => {
            const next = e.target.checked;
            setIsPrelevement(next);
            if (next) setType("expense");
          }}
          disabled={category === "Transfer"}
        />
        <span className="prelevement-pill" aria-hidden="true">
          <span className="prelevement-dot" />
        </span>
        <span className="prelevement-text">{t.prelevement}</span>
      </label>
      <div className="transaction-actions">
        {onCancel && (
          <button
            type="button"
            className="form-secondary"
            onClick={onCancel}
          >
            {t.cancel}
          </button>
        )}
        <button type="submit">
          {initialValues ? t.update : t.add}
        </button>
      </div>
    </form>
  );
}
