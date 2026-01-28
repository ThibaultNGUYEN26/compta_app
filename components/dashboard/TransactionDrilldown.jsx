import React, { useState, useMemo } from "react";
import "./TransactionDrilldown.css";

const formatCurrency = (value) => `${value.toFixed(2)} EUR`;
const formatDate = (date, locale) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale || "en-US");
};

export default function TransactionDrilldown({
  transactions,
  scope,
  onFilter,
  language = "fr",
}) {
  const labels = {
    fr: {
      title: "Détails des transactions",
      search: "Rechercher par nom...",
      allTypes: "Tous les types",
      income: "Revenu",
      expense: "Dépense",
      allCategories: "Toutes les catégories",
      directDebitOnly: "Prélèvements uniquement",
      savingsOnly: "Épargne uniquement",
      clear: "Effacer les filtres",
      date: "Date",
      name: "Nom",
      account: "Compte",
      category: "Catégorie",
      amount: "Montant",
      tags: "Tags",
      empty: "Aucune transaction trouvée",
      of: "sur",
      current: "Courant",
      savings: "Épargne",
      directDebit: "Prélèvement",
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
      locale: "fr-FR",
    },
    en: {
      title: "Transaction Details",
      search: "Search by name...",
      allTypes: "All types",
      income: "Income",
      expense: "Expense",
      allCategories: "All categories",
      directDebitOnly: "Direct debit only",
      savingsOnly: "Savings only",
      clear: "Clear filters",
      date: "Date",
      name: "Name",
      account: "Account",
      category: "Category",
      amount: "Amount",
      tags: "Tags",
      empty: "No transactions found",
      of: "of",
      current: "Current",
      savings: "Savings",
      directDebit: "Direct Debit",
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
      locale: "en-US",
    },
  };
  const i18n = labels[language] || labels.fr;

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [prelevFilter, setPrelevFilter] = useState(false);
  const [savingFilter, setSavingFilter] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set();
    transactions.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  const getDisplayType = (t) => {
    if (t.category !== "Transfer") return t.type;
    if (scope?.type === "current" && scope?.name) {
      if (t.transferAccount === scope.name) return "income";
      if (t.currentAccount === scope.name) return "expense";
    }
    return t.type;
  };

  const getAccountLabel = (t) => {
    if (t.category === "Transfer") {
      const from = t.currentAccount || i18n.current;
      const to = t.transferAccount || i18n.current;
      return `${from} → ${to}`;
    }
    if (t.category === "Saving") {
      const from = t.currentAccount || i18n.current;
      const to = t.savingAccount || i18n.savings;
      return `${from} → ${to}`;
    }
    return t.currentAccount || "";
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search filter
      if (searchQuery && !t.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && getDisplayType(t) !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && t.category !== categoryFilter) {
        return false;
      }

      // Prelevement filter
      if (prelevFilter && !t.isPrelevement) {
        return false;
      }

      // Saving transfer filter
      if (savingFilter && t.category !== "Saving") {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter, prelevFilter, savingFilter, scope]);

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setPrelevFilter(false);
    setSavingFilter(false);
  };

  const hasFilters = searchQuery || typeFilter !== "all" || categoryFilter !== "all" || prelevFilter || savingFilter;

  return (
    <div className="transaction-drilldown">
      <div className="drilldown-header">
        <h4 className="chart-title">{i18n.title}</h4>
        <span className="drilldown-count">
          {filteredTransactions.length} {i18n.of} {transactions.length}
        </span>
      </div>

      <div className="drilldown-filters">
        <input
          type="text"
          className="drilldown-search"
          placeholder={i18n.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <div className="drilldown-filter-row">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">{i18n.allTypes}</option>
            <option value="income">{i18n.income}</option>
            <option value="expense">{i18n.expense}</option>
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">{i18n.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {i18n.categories[cat] || cat}
              </option>
            ))}
          </select>

          <label className="drilldown-checkbox">
            <input
              type="checkbox"
              checked={prelevFilter}
              onChange={(e) => setPrelevFilter(e.target.checked)}
            />
            <span>{i18n.directDebitOnly}</span>
          </label>

          <label className="drilldown-checkbox">
            <input
              type="checkbox"
              checked={savingFilter}
              onChange={(e) => setSavingFilter(e.target.checked)}
            />
            <span>{i18n.savingsOnly}</span>
          </label>

          {hasFilters && (
            <button type="button" className="drilldown-clear" onClick={clearFilters}>
              {i18n.clear}
            </button>
          )}
        </div>
      </div>

      <div className="drilldown-table-wrapper">
        <table className="drilldown-table">
          <thead>
            <tr>
              <th>{i18n.date}</th>
              <th>{i18n.name}</th>
              <th>{i18n.account}</th>
              <th>{i18n.category}</th>
              <th>{i18n.amount}</th>
              <th>{i18n.tags}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="drilldown-empty">
                  {i18n.empty}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx, index) => (
                <tr key={tx.id || index}>
                  <td className="drilldown-date">
                    {formatDate(tx.date, i18n.locale)}
                  </td>
                  <td className="drilldown-name">{tx.name}</td>
                  <td className="drilldown-account">{getAccountLabel(tx)}</td>
                  <td className="drilldown-category">
                    {i18n.categories[tx.category] || tx.category}
                  </td>
                  <td
                    className={`drilldown-amount ${
                      tx.isPrelevement
                        ? "prelevement"
                        : getDisplayType(tx) === "income"
                        ? "income"
                        : "expense"
                    }`}
                  >
                    {getDisplayType(tx) === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount || 0)}
                  </td>
                  <td className="drilldown-tags">
                    {tx.isPrelevement && (
                      <span className="tag tag-prelevement">
                        {i18n.directDebit}
                      </span>
                    )}
                    {tx.category === "Saving" && (
                      <span className="tag tag-saving">{tx.savingAccount}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
