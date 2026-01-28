import React from "react";
import "./KPICard.css";

export default function KPICard({ label, value, meta, variant = "default", count, percentage }) {
  return (
    <div className={`kpi-card kpi-card-${variant}`}>
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
      {(count !== undefined || percentage !== undefined) && (
        <div className="kpi-metrics">
          {count !== undefined && (
            <span className="kpi-count">{count} Transactions</span>
          )}
          {percentage !== undefined && <span className="kpi-percentage">{percentage}%</span>}
        </div>
      )}
      {meta && <span className="kpi-meta">{meta}</span>}
    </div>
  );
}
