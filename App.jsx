import React, { useEffect, useState } from "react";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import ArchivePage from "./components/ArchivePage";
import StatsPage from "./components/StatsPage";
import AccountManager from "./components/AccountManager";
import Navigation from "./components/Navigation";

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
  "Transfer",
  "Saving",
  "Other",
];

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [view, setView] = useState("home");
  const [currentAccounts, setCurrentAccounts] = useState([
    "Current account",
  ]);
  const [savingAccounts, setSavingAccounts] = useState([]);
  const [savingLinks, setSavingLinks] = useState({});
  const [language, setLanguage] = useState("fr");
  const [theme, setTheme] = useState("light");
  const [settingsMeta, setSettingsMeta] = useState({});
  const [showAccounts, setShowAccounts] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [selectedCurrentAccount, setSelectedCurrentAccount] = useState(
    "Current account"
  );
  const [hideRecentAmounts, setHideRecentAmounts] = useState(false);
  const [currentAccountOpen, setCurrentAccountOpen] = useState(false);
  const currentAccountRef = React.useRef(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const settingsLabels = {
    fr: { title: "Comptes", close: "Fermer" },
    en: { title: "Accounts", close: "Close" },
  };
  const settingsText = settingsLabels[language] || settingsLabels.fr;

  const homeLabels = {
    fr: {
      newTransaction: "Nouvelle transaction",
      account: "Compte",
      recentActivity: "Activité récente",
    },
    en: {
      newTransaction: "New transaction",
      account: "Account",
      recentActivity: "Recent activity",
    },
  };
  const homeText = homeLabels[language] || homeLabels.fr;

  const headerLabels = {
    fr: { personalFinance: "Finances personnelles" },
    en: { personalFinance: "Personal Finance" },
  };
  const headerText = headerLabels[language] || headerLabels.fr;
  const privacyLabels = {
    fr: {
      show: "Afficher les montants",
      hide: "Masquer les montants",
    },
    en: {
      show: "Show amounts",
      hide: "Hide amounts",
    },
  };
  const privacyText = privacyLabels[language] || privacyLabels.fr;

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      if (!window.comptaApi?.loadSettings) return;
      const settings = await window.comptaApi.loadSettings();
      if (cancelled || !settings?.accounts) return;
      const { accounts, categories: savedCategories, ...rest } = settings;
      setCurrentAccounts(
        Array.isArray(accounts.current) && accounts.current.length
          ? accounts.current
          : ["Current account"]
      );
      setSavingAccounts(
        Array.isArray(accounts.saving)
          ? accounts.saving
          : []
      );
      setSavingLinks(
        accounts.savingLinks &&
          typeof accounts.savingLinks === "object"
          ? accounts.savingLinks
          : {}
      );
      setLanguage(rest.language || "fr");
      setTheme(rest.theme || "light");
      setSettingsMeta(rest);
      if (Array.isArray(savedCategories) && savedCategories.length) {
        setCategories(savedCategories);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
      setSelectedCurrentAccount((prev) => {
        const nextCurrent =
          Array.isArray(accounts.current) && accounts.current.length
            ? accounts.current
            : ["Current account"];
        return nextCurrent.includes(prev) ? prev : nextCurrent[0];
      });
      setAccountsLoaded(true);
    };
    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistAccounts = (
    nextCurrent,
    nextSaving,
    nextSavingLinks,
    nextCategories,
    nextLanguage,
    nextTheme
  ) => {
    if (!window.comptaApi?.saveSettings) return;
    return window.comptaApi.saveSettings({
      ...settingsMeta,
      language: nextLanguage,
      theme: nextTheme,
      accounts: {
        current: nextCurrent,
        saving: nextSaving,
        savingLinks: nextSavingLinks,
      },
      categories: nextCategories,
    });
  };

  useEffect(() => {
    if (!accountsLoaded) return;
    persistAccounts(
      currentAccounts,
      savingAccounts,
      savingLinks,
      categories,
      language,
      theme
    );
  }, [
    accountsLoaded,
    currentAccounts,
    savingAccounts,
    savingLinks,
    categories,
    language,
    theme,
    settingsMeta,
  ]);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!currentAccounts.length) return;
    setSelectedCurrentAccount((prev) =>
      currentAccounts.includes(prev) ? prev : currentAccounts[0]
    );
  }, [currentAccounts]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!currentAccountRef.current) return;
      if (!currentAccountRef.current.contains(event.target)) {
        setCurrentAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!window.comptaApi?.loadTransactions) return;
      const loaded = await window.comptaApi.loadTransactions();
      if (!cancelled && Array.isArray(loaded)) {
        const normalized = loaded.map((item) =>
          item.id
            ? item
            : {
                ...item,
                id:
                  typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              }
        );
        setTransactions(normalized);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = (transaction) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const updated = [
      {
        ...transaction,
        id,
        createdAt: new Date().toISOString(),
      },
      ...transactions,
    ];
    setTransactions(updated);
    if (window.comptaApi?.saveTransactions) {
      window.comptaApi
        .saveTransactions(updated)
        .then(() => window.comptaApi?.loadTransactions?.())
        .then((loaded) => {
          if (Array.isArray(loaded)) {
            setTransactions(loaded);
          }
        })
        .catch(() => {});
    }
  };

  const addCurrentAccount = (name) => {
    setCurrentAccounts((prev) => [...prev, name]);
  };

  const addSavingAccount = (name) => {
    setSavingAccounts((prev) => [...prev, name]);
    setSavingLinks((prev) => {
      const fallback = currentAccounts[0] || "";
      return { ...prev, [name]: prev[name] || fallback };
    });
  };

  const renameCurrentAccount = (index, nextName) => {
    setCurrentAccounts((prev) =>
      prev.map((name, i) => (i === index ? nextName : name))
    );
  };

  const renameSavingAccount = (index, nextName) => {
    setSavingAccounts((prev) =>
      prev.map((name, i) => (i === index ? nextName : name))
    );
    setSavingLinks((prev) => {
      const prevName = savingAccounts[index];
      if (!prevName || prevName === nextName) return prev;
      const next = { ...prev };
      if (Object.prototype.hasOwnProperty.call(next, prevName)) {
        next[nextName] = next[prevName];
        delete next[prevName];
      } else {
        next[nextName] = currentAccounts[0] || "";
      }
      return next;
    });
  };

  const deleteCurrentAccount = (index) => {
    setCurrentAccounts((prev) =>
      prev.filter((_, i) => i !== index)
    );
    setSavingLinks((prev) => {
      const removed = currentAccounts[index];
      if (!removed) return prev;
      const remaining = currentAccounts.filter((_, i) => i !== index);
      const fallback = remaining[0] || "";
      const next = { ...prev };
      Object.keys(next).forEach((savingName) => {
        if (next[savingName] === removed) {
          next[savingName] = fallback;
        }
      });
      return next;
    });
  };

  const deleteSavingAccount = (index) => {
    setSavingAccounts((prev) =>
      prev.filter((_, i) => i !== index)
    );
    setSavingLinks((prev) => {
      const removed = savingAccounts[index];
      if (!removed) return prev;
      const next = { ...prev };
      delete next[removed];
      return next;
    });
  };

  const linkSavingAccount = (savingName, currentName) => {
    setSavingLinks((prev) => ({
      ...prev,
      [savingName]: currentName,
    }));
  };

  const addCategory = (name) => {
    setCategories((prev) => {
      const trimmed = name.trim();
      if (!trimmed) return prev;
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
  };

  const renameCategory = (index, nextName) => {
    setCategories((prev) => {
      const trimmed = nextName.trim();
      if (!trimmed) return prev;
      if (prev.includes(trimmed) && prev[index] !== trimmed) return prev;
      return prev.map((name, i) => (i === index ? trimmed : name));
    });
  };

  const deleteCategory = (index) => {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const mergedCategories = React.useMemo(() => {
    const base = Array.isArray(categories) && categories.length
      ? categories
      : DEFAULT_CATEGORIES;
    const set = new Set(base);
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [categories, transactions]);

  const handleUpdate = (transaction) => {
    const updated = transactions.map((item) =>
      item.id === transaction.id ? { ...item, ...transaction } : item
    );
    setTransactions(updated);
    if (window.comptaApi?.saveTransactions) {
      window.comptaApi
        .saveTransactions(updated)
        .then(() => window.comptaApi?.loadTransactions?.())
        .then((loaded) => {
          if (Array.isArray(loaded)) {
            const normalized = loaded.map((item) =>
              item.id
                ? item
                : {
                    ...item,
                    id:
                      typeof crypto !== "undefined" && crypto.randomUUID
                        ? crypto.randomUUID()
                        : `${Date.now()}-${Math.random()
                            .toString(16)
                            .slice(2)}`,
                  }
            );
            setTransactions(normalized);
          }
        })
        .catch(() => {});
    }
  };

  const handleDelete = (id) => {
    const updated = transactions.filter((item) => item.id !== id);
    setTransactions(updated);
    if (window.comptaApi?.saveTransactions) {
      window.comptaApi
        .saveTransactions(updated)
        .then(() => window.comptaApi?.loadTransactions?.())
        .then((loaded) => {
          if (Array.isArray(loaded)) {
            setTransactions(loaded);
          }
        })
        .catch(() => {});
    }
  };

  return (
    <div className={`app${view === "stats" ? " is-stats" : ""}`}>
      <header className="app-header">
        <div className="app-header-brand">
          <p className="app-eyebrow">{headerText.personalFinance}</p>
          <h1 className="app-title">Compta</h1>
        </div>
        <div className="app-actions">
          <button
            type="button"
            className="privacy-button"
            onClick={() => setHideRecentAmounts((prev) => !prev)}
            aria-pressed={hideRecentAmounts}
            aria-label={hideRecentAmounts ? privacyText.show : privacyText.hide}
            title={hideRecentAmounts ? privacyText.show : privacyText.hide}
          >
            {hideRecentAmounts ? (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                className="privacy-icon"
              >
                <path
                  d="M3 4.5 20.5 22m-9.8-2.2C6.7 19 3.7 16.6 2 12c.7-1.8 1.7-3.3 3-4.6m4.2-2.4A10.7 10.7 0 0 1 12 5c5.1 0 9.4 3.2 10.9 7-0.5 1.3-1.2 2.5-2.1 3.5M9.5 9.6a3.5 3.5 0 0 0 4.9 4.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                className="privacy-icon"
              >
                <path
                  d="M2 12c2.1-4.4 6-7 10-7s7.9 2.6 10 7c-2.1 4.4-6 7-10 7s-7.9-2.6-10-7Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <circle cx="12" cy="12" r="3.2" fill="currentColor" />
              </svg>
            )}
          </button>
          <Navigation
            currentView={view}
            onViewChange={setView}
            language={language}
          />
          <button
            type="button"
            className="settings-button"
            onClick={() => setShowAccounts((prev) => !prev)}
            aria-label="Open settings"
          >
            ⚙️
          </button>
        </div>
      </header>
      {showAccounts && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAccounts(false)}
        >
          <div
            className="modal-card panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="panel-title">{settingsText.title}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAccounts(false)}
              >
                {settingsText.close}
              </button>
            </div>
            <AccountManager
              currentAccounts={currentAccounts}
              savingAccounts={savingAccounts}
              savingLinks={savingLinks}
              categories={categories}
              language={language}
              theme={theme}
              onAddCurrent={addCurrentAccount}
              onAddSaving={addSavingAccount}
              onRenameCurrent={renameCurrentAccount}
              onRenameSaving={renameSavingAccount}
              onDeleteCurrent={deleteCurrentAccount}
              onDeleteSaving={deleteSavingAccount}
              onLinkSaving={linkSavingAccount}
              onAddCategory={addCategory}
              onRenameCategory={renameCategory}
              onDeleteCategory={deleteCategory}
              onLanguageChange={setLanguage}
              onThemeChange={setTheme}
            />
          </div>
        </div>
      )}
      {view === "home" ? (
        <main className="app-grid">
          <section className="panel panel-form">
            <h2 className="panel-title">{homeText.newTransaction}</h2>
            <div className="panel-account-row">
              <label className="panel-account-select">
                <span>{homeText.account}</span>
                <div className="category-picker" ref={currentAccountRef}>
                  <button
                    type="button"
                    className="category-trigger"
                    onClick={() => setCurrentAccountOpen((prev) => !prev)}
                    aria-expanded={currentAccountOpen}
                  >
                    {selectedCurrentAccount}
                    <span className="category-caret" aria-hidden="true" />
                  </button>
                  {currentAccountOpen && (
                    <div className="category-menu" role="listbox">
                      {(currentAccounts.length
                        ? currentAccounts
                        : ["Current account"]
                      ).map((account) => (
                        <button
                          key={account}
                          type="button"
                          className={`category-option${
                            account === selectedCurrentAccount ? " is-selected" : ""
                          }`}
                          onClick={() => {
                            setSelectedCurrentAccount(account);
                            setCurrentAccountOpen(false);
                          }}
                          role="option"
                          aria-selected={account === selectedCurrentAccount}
                        >
                          {account}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            </div>
            <TransactionForm
              onSubmit={handleAdd}
              currentAccounts={currentAccounts}
              savingAccounts={savingAccounts}
              selectedCurrentAccount={selectedCurrentAccount}
              categories={mergedCategories}
              language={language}
            />
          </section>
          <section className="panel panel-list">
            <h2 className="panel-title">{homeText.recentActivity}</h2>
            <TransactionList
              transactions={transactions}
              limit={5}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              currentAccounts={currentAccounts}
              savingAccounts={savingAccounts}
              categories={mergedCategories}
              maskAmounts={hideRecentAmounts}
              language={language}
            />
          </section>
        </main>
      ) : view === "archive" ? (
        <ArchivePage
          transactions={transactions}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          currentAccounts={currentAccounts}
          savingAccounts={savingAccounts}
          savingLinks={savingLinks}
          categories={mergedCategories}
          maskAmounts={hideRecentAmounts}
          language={language}
        />
      ) : (
        <main className="app-stats">
          <section className="panel panel-stats">
            <StatsPage
              transactions={transactions}
              currentAccounts={currentAccounts}
              savingAccounts={savingAccounts}
              savingLinks={savingLinks}
              maskAmounts={hideRecentAmounts}
              language={language}
            />
          </section>
        </main>
      )}
    </div>
  );
}
