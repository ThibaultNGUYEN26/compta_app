import React, { useState, useMemo } from "react";
import "./TransactionDrilldown.css";

const formatCurrency = (value) => `${value.toFixed(2)} EUR`;
const formatDate = (date) => {
  const d = new Date(date);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

export default function TransactionDrilldown({ transactions, onFilter }) {
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search filter
      if (searchQuery && !t.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && t.type !== typeFilter) {
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
  }, [transactions, searchQuery, typeFilter, categoryFilter, prelevFilter, savingFilter]);

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
        <h4 className="chart-title">Transaction Details</h4>
        <span className="drilldown-count">
          {filteredTransactions.length} of {transactions.length}
        </span>
      </div>

      <div className="drilldown-filters">
        <input
          type="text"
          className="drilldown-search"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <div className="drilldown-filter-row">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <label className="drilldown-checkbox">
            <input
              type="checkbox"
              checked={prelevFilter}
              onChange={(e) => setPrelevFilter(e.target.checked)}
            />
            <span>Prelevements only</span>
          </label>

          <label className="drilldown-checkbox">
            <input
              type="checkbox"
              checked={savingFilter}
              onChange={(e) => setSavingFilter(e.target.checked)}
            />
            <span>Savings only</span>
          </label>

          {hasFilters && (
            <button type="button" className="drilldown-clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="drilldown-table-wrapper">
        <table className="drilldown-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Account</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="drilldown-empty">
                  No transactions found
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t, index) => (
                <tr key={t.id || index}>
                  <td className="drilldown-date">{formatDate(t.date)}</td>
                  <td className="drilldown-name">{t.name}</td>
                  <td className="drilldown-account">{t.currentAccount || ""}</td>
                  <td className="drilldown-category">{t.category}</td>
                  <td className={`drilldown-amount ${t.type === "income" ? "income" : "expense"}`}>
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount || 0)}
                  </td>
                  <td className="drilldown-tags">
                    {t.isPrelevement && <span className="tag tag-prelevement">Prelevement</span>}
                    {t.category === "Saving" && (
                      <span className="tag tag-saving">{t.savingAccount}</span>
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
