import React from "react";
import "./CategoryBreakdown.css";

const formatCurrency = (value) => `${value.toFixed(2)} EUR`;

export default function CategoryBreakdown({ categories, totalOutcome, onCategoryClick }) {
  if (!categories || categories.length === 0) {
    return <div className="chart-empty">No expense data</div>;
  }

  return (
    <div className="category-breakdown">
      <h4 className="chart-title">Expenses by Category</h4>
      <div className="category-bars">
        {categories.map((cat) => {
          const percentage = totalOutcome > 0 ? (cat.total / totalOutcome) * 100 : 0;
          return (
            <div
              key={cat.name}
              className="category-bar-item"
              onClick={() => onCategoryClick?.(cat.name)}
            >
              <div className="category-bar-header">
                <span className="category-name">{cat.name}</span>
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
              <span className="category-count">{cat.count} transactions</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
