import React from "react";
import "./CategoryBreakdown.css";

const formatCurrency = (value) => `${value.toFixed(2)} EUR`;

export default function CategoryBreakdown({
  categories,
  totalOutcome,
  onCategoryClick,
  language = "fr",
}) {
  const labels = {
    fr: {
      title: "Dépenses par catégorie",
      empty: "Aucune dépense",
      transactions: "transactions",
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
      title: "Expenses by Category",
      empty: "No expense data",
      transactions: "transactions",
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

  if (!categories || categories.length === 0) {
    return <div className="chart-empty">{t.empty}</div>;
  }

  return (
    <div className="category-breakdown">
      <h4 className="chart-title">{t.title}</h4>
      <div className="category-bars">
        {categories.map((cat) => {
          const percentage = totalOutcome > 0 ? (cat.total / totalOutcome) * 100 : 0;
          const name = t.categories[cat.name] || cat.name;
          return (
            <div
              key={cat.name}
              className="category-bar-item"
              onClick={() => onCategoryClick?.(cat.name)}
            >
              <div className="category-bar-header">
                <span className="category-name">{name}</span>
                <div className="category-values">
                  <span className="category-amount">{formatCurrency(cat.total)}</span>
                  <span className="category-percentage">{percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="category-bar-track">
                <div
                  className="category-bar-fill"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <span className="category-count">
                {cat.count} {t.transactions}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
