import React, { useState } from "react";
import "./AccountManager.css";

export default function AccountManager({
  currentAccounts,
  savingAccounts,
  savingLinks = {},
  language = "fr",
  onAddCurrent,
  onAddSaving,
  onRenameCurrent,
  onRenameSaving,
  onDeleteCurrent,
  onDeleteSaving,
  onLinkSaving,
  onLanguageChange,
}) {
  const labels = {
    fr: {
      subtitle: "Gérez vos comptes courants et d'épargne.",
      currentTitle: "Comptes courants",
      savingTitle: "Comptes d'épargne",
      addCurrent: "Ajouter un compte courant",
      addSaving: "Ajouter un compte d'épargne",
      add: "Ajouter",
      edit: "Modifier",
      cancel: "Annuler",
      delete: "Supprimer",
      save: "Enregistrer",
      linkedCurrent: "Compte courant lié",
      language: "Langue",
      fr: "Français",
      en: "English",
    },
    en: {
      subtitle: "Manage your current and saving accounts.",
      currentTitle: "Current accounts",
      savingTitle: "Saving accounts",
      addCurrent: "Add current account",
      addSaving: "Add saving account",
      add: "Add",
      edit: "Edit",
      cancel: "Cancel",
      delete: "Delete",
      save: "Save",
      linkedCurrent: "Linked current",
      language: "Language",
      fr: "French",
      en: "English",
    },
  };

  const t = labels[language] || labels.fr;

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
    <div className={`account-manager${language === "en" ? " is-en" : ""}`}>
      <div className="account-settings-row">
        <label className="account-settings-label">
          {t.language}
          <select
            value={language}
            onChange={(e) => onLanguageChange?.(e.target.value)}
          >
            <option value="fr">{t.fr}</option>
            <option value="en">{t.en}</option>
          </select>
        </label>
      </div>
      <p className="account-subtitle">
        {t.subtitle}
      </p>
      <div className="account-grid">
        <section className="account-block">
          <h3>{t.currentTitle}</h3>
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
                        {t.cancel}
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
                        {t.delete}
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
                        {t.save}
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
                      {t.edit}
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <form className="account-form" onSubmit={submitCurrent}>
            <input
              type="text"
              placeholder={t.addCurrent}
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
            />
            <button type="submit">{t.add}</button>
          </form>
        </section>
        <section className="account-block">
          <h3>{t.savingTitle}</h3>
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
                        {t.cancel}
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
                        {t.delete}
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
                        {t.save}
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
                      {t.edit}
                    </button>
                  </>
                )}
                <div className="account-link-row">
                  <label className="account-link-label">
                    {t.linkedCurrent}
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
              placeholder={t.addSaving}
              value={savingName}
              onChange={(e) => setSavingName(e.target.value)}
            />
            <button type="submit">{t.add}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
