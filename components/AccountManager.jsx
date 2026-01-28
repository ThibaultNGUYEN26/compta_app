import React, { useState } from "react";
import "./AccountManager.css";

export default function AccountManager({
  currentAccounts,
  savingAccounts,
  savingLinks = {},
  onAddCurrent,
  onAddSaving,
  onRenameCurrent,
  onRenameSaving,
  onDeleteCurrent,
  onDeleteSaving,
  onLinkSaving,
}) {
  const [currentName, setCurrentName] = useState("");
  const [savingName, setSavingName] = useState("");
  const [editingCurrentIndex, setEditingCurrentIndex] = useState(null);
  const [editingCurrentValue, setEditingCurrentValue] = useState("");
  const [editingSavingIndex, setEditingSavingIndex] = useState(null);
  const [editingSavingValue, setEditingSavingValue] = useState("");

  const submitCurrent = (e) => {
    e.preventDefault();
    const name = currentName.trim();
    if (!name) return;
    onAddCurrent?.(name);
    setCurrentName("");
  };

  const submitSaving = (e) => {
    e.preventDefault();
    const name = savingName.trim();
    if (!name) return;
    onAddSaving?.(name);
    setSavingName("");
  };

  return (
    <div className="account-manager">
      <p className="account-subtitle">
        Manage your current and saving accounts.
      </p>
      <div className="account-grid">
        <section className="account-block">
          <h3>Current accounts</h3>
          <ul>
            {currentAccounts.map((name, index) => (
              <li key={`${name}-${index}`} className="account-item">
                {editingCurrentIndex === index ? (
                  <>
                    <input
                      className="account-edit-input"
                      type="text"
                      value={editingCurrentValue}
                      onChange={(e) => setEditingCurrentValue(e.target.value)}
                    />
                    <div className="account-actions">
                      <button
                        type="button"
                        className="account-cancel"
                        onClick={() => {
                          setEditingCurrentIndex(null);
                          setEditingCurrentValue("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="account-delete"
                        onClick={() => {
                          onDeleteCurrent?.(index);
                          setEditingCurrentIndex(null);
                          setEditingCurrentValue("");
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = editingCurrentValue.trim();
                          if (!trimmed) return;
                          onRenameCurrent?.(index, trimmed);
                          setEditingCurrentIndex(null);
                          setEditingCurrentValue("");
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span>{name}</span>
                    <button
                      type="button"
                      className="account-edit"
                      onClick={() => {
                        setEditingCurrentIndex(index);
                        setEditingCurrentValue(name);
                      }}
                    >
                      Edit
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <form className="account-form" onSubmit={submitCurrent}>
            <input
              type="text"
              placeholder="Add current account"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>
        </section>
        <section className="account-block">
          <h3>Saving accounts</h3>
          <ul>
            {savingAccounts.map((name, index) => (
              <li key={`${name}-${index}`} className="account-item">
                {editingSavingIndex === index ? (
                  <>
                    <input
                      className="account-edit-input"
                      type="text"
                      value={editingSavingValue}
                      onChange={(e) => setEditingSavingValue(e.target.value)}
                    />
                    <div className="account-actions">
                      <button
                        type="button"
                        className="account-cancel"
                        onClick={() => {
                          setEditingSavingIndex(null);
                          setEditingSavingValue("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="account-delete"
                        onClick={() => {
                          onDeleteSaving?.(index);
                          setEditingSavingIndex(null);
                          setEditingSavingValue("");
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = editingSavingValue.trim();
                          if (!trimmed) return;
                          onRenameSaving?.(index, trimmed);
                          setEditingSavingIndex(null);
                          setEditingSavingValue("");
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span>{name}</span>
                    <button
                      type="button"
                      className="account-edit"
                      onClick={() => {
                        setEditingSavingIndex(index);
                        setEditingSavingValue(name);
                      }}
                    >
                      Edit
                    </button>
                  </>
                )}
                <div className="account-link-row">
                  <label className="account-link-label">
                    Linked current
                    <select
                      value={savingLinks[name] || currentAccounts[0] || ""}
                      onChange={(e) => onLinkSaving?.(name, e.target.value)}
                    >
                      {(currentAccounts.length ? currentAccounts : ["Current account"]).map(
                        (account) => (
                          <option key={account} value={account}>
                            {account}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>
              </li>
            ))}
          </ul>
          <form className="account-form" onSubmit={submitSaving}>
            <input
              type="text"
              placeholder="Add saving account"
              value={savingName}
              onChange={(e) => setSavingName(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>
        </section>
      </div>
    </div>
  );
}
