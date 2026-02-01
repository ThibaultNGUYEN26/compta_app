import React, { useEffect, useRef, useState } from "react";
import "./TransactionForm.css";

const DEFAULT_CATEGORIES = [
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
  categories = DEFAULT_CATEGORIES,
  language = "fr",
}) {
  const labels = {
    fr: {
      dateLabel: "Date",
      namePlaceholder: "Nom de la transaction",
      amountPlaceholder: "Montant",
      typeLabel: "Type",
      outcome: "Sortie",
      income: "Entrée",
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
  const categoryOptions = categories.length ? categories : DEFAULT_CATEGORIES;
  const [category, setCategory] = useState(categoryOptions[0] || "Other");
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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef(null);

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
      setCategory(categoryOptions[0] || "Other");
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
    setCategory(safeInitial.category || categoryOptions[0] || "Other");
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
    setCategoryOpen(false);
  }, [
    currentAccounts,
    initialValues,
    savingAccounts,
    selectedCurrentAccount,
    categoryOptions,
    today,
  ]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!categoryRef.current) return;
      if (!categoryRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectCategory = (next) => {
    setCategory(next);
    if (next === "Saving") {
      setSavingAccount(savingAccounts[0] || "");
    }
    if (next === "Transfer") {
      setTransferAccount(currentAccounts[0] || "");
      setIsPrelevement(false);
    }
    setCategoryOpen(false);
  };

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
      setCategory(categoryOptions[0] || "Other");
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
      <div className="category-picker" ref={categoryRef}>
        <button
          type="button"
          className="category-trigger"
          onClick={() => setCategoryOpen((prev) => !prev)}
          aria-expanded={categoryOpen}
        >
          {t.categories[category] || category}
          <span className="category-caret" aria-hidden="true" />
        </button>
        {categoryOpen && (
          <div className="category-menu" role="listbox">
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-option${
                  cat === category ? " is-selected" : ""
                }`}
                onClick={() => selectCategory(cat)}
                role="option"
                aria-selected={cat === category}
              >
                {t.categories[cat] || cat}
              </button>
            ))}
          </div>
        )}
      </div>
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
