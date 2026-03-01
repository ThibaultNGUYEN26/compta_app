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
  "Account Transfer",
  "Saving",
  "Shopping",
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
  const [dataPathInfo, setDataPathInfo] = useState({
    defaultPath: "",
    currentPath: "",
    isCustom: false,
  });
  const [updateStatus, setUpdateStatus] = useState({
    status: "idle",
    progress: null,
    message: "",
  });
  const [appVersion, setAppVersion] = useState("-");
  const [showAccounts, setShowAccounts] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [selectedCurrentAccount, setSelectedCurrentAccount] = useState(
    "Current account"
  );
  const [hideRecentAmounts, setHideRecentAmounts] = useState(false);
  const [currentAccountOpen, setCurrentAccountOpen] = useState(false);
  const currentAccountRef = React.useRef(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [recentScope, setRecentScope] = useState("all");
  const [recentMonth, setRecentMonth] = useState(new Date().getMonth());

  const settingsLabels = {
    fr: { title: "Comptes", close: "Fermer" },
    en: { title: "Accounts", close: "Close" },
  };
  const settingsText = settingsLabels[language] || settingsLabels.fr;
  const updateLabels = {
    fr: {
      available: "Mise a jour disponible. Telechargement...",
      downloading: "Telechargement de la mise a jour",
      downloaded: "Mise a jour prete. Redemarrer pour installer.",
      error: "Erreur de mise a jour",
      restart: "Redemarrer",
    },
    en: {
      available: "Update available. Downloading...",
      downloading: "Downloading update",
      downloaded: "Update ready. Restart to install.",
      error: "Update error",
      restart: "Restart",
    },
  };
  const updateText = updateLabels[language] || updateLabels.fr;
  const homeLabels = {
    fr: {
      newTransaction: "Nouvelle transaction",
      account: "Compte",
      recentActivity: "Activité récente",
      recentAll: "Tout",
      recentMonth: "Mois",
    },
    en: {
      newTransaction: "New transaction",
      account: "Account",
      recentActivity: "Recent activity",
      recentAll: "All",
      recentMonth: "Month",
    },
  };
  const homeText = homeLabels[language] || homeLabels.fr;
  const monthLabels = React.useMemo(() => {
    const locale = language === "en" ? "en-US" : "fr-FR";
    return Array.from({ length: 12 }, (_, index) =>
      new Date(2024, index, 1).toLocaleString(locale, { month: "long" })
    );
  }, [language]);
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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
      setHideRecentAmounts(Boolean(rest.hideAmounts));
      setSettingsMeta(rest);
      if (window.comptaApi?.getAppVersion) {
        const version = await window.comptaApi.getAppVersion();
        if (!cancelled && version) {
          setAppVersion(version);
        }
      }
      if (window.comptaApi?.getDataPath) {
        const info = await window.comptaApi.getDataPath();
        if (!cancelled && info) {
          setDataPathInfo(info);
        }
      }
      if (Array.isArray(savedCategories) && savedCategories.length) {
        const merged = new Set(savedCategories);
        merged.add("Transfer");
        merged.add("Account Transfer");
        merged.add("Shopping");
        setCategories(Array.from(merged));
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
    nextTheme,
    nextHideAmounts
  ) => {
    if (!window.comptaApi?.saveSettings) return;
    return window.comptaApi.saveSettings({
      ...settingsMeta,
      language: nextLanguage,
      theme: nextTheme,
      hideAmounts: nextHideAmounts,
      accounts: {
        current: nextCurrent,
        saving: nextSaving,
        savingLinks: nextSavingLinks,
      },
      categories: nextCategories,
    });
  };

  const handleSelectDataPath = async () => {
    if (!window.comptaApi?.selectDataPath) return;
    const info = await window.comptaApi.selectDataPath();
    if (!info) return;
    setDataPathInfo(info);
    setSettingsMeta((prev) => ({
      ...prev,
      dataPath: info.isCustom ? info.currentPath : undefined,
    }));
  };

  const handleResetDataPath = async () => {
    if (!window.comptaApi?.resetDataPath) return;
    const info = await window.comptaApi.resetDataPath();
    if (!info) return;
    setDataPathInfo(info);
    setSettingsMeta((prev) => {
      const next = { ...prev };
      if (Object.prototype.hasOwnProperty.call(next, "dataPath")) {
        delete next.dataPath;
      }
      return next;
    });
  };

  const handleOpenDataPath = async () => {
    if (!window.comptaApi?.openDataPath) return;
    await window.comptaApi.openDataPath();
  };

  useEffect(() => {
    if (!accountsLoaded) return;
    persistAccounts(
      currentAccounts,
      savingAccounts,
      savingLinks,
      categories,
      language,
      theme,
      hideRecentAmounts
    );
  }, [
    accountsLoaded,
    currentAccounts,
    savingAccounts,
    savingLinks,
    categories,
    language,
    theme,
    hideRecentAmounts,
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
    if (!window.comptaApi?.onUpdateStatus) return undefined;
    const unsubscribe = window.comptaApi.onUpdateStatus((payload) => {
      if (!payload?.status) return;
      setUpdateStatus((prev) => ({
        ...prev,
        status: payload.status,
        progress: payload.progress || null,
        message: payload.message || "",
      }));
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

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

  const syncTransactionsAfterRename = (prevName, nextName, type) => {
    if (!prevName || prevName === nextName) return;
    let changed = false;
    const updated = transactions.map((item) => {
      let touched = false;
      const next = { ...item };
      if (type === "current") {
        if (next.currentAccount === prevName) {
          next.currentAccount = nextName;
          touched = true;
        }
        if (next.transferAccount === prevName) {
          next.transferAccount = nextName;
          touched = true;
        }
        if (
          next.accountName === prevName &&
          (next.accountType === "current" || next.category !== "Saving")
        ) {
          next.accountName = nextName;
          touched = true;
        }
      } else if (type === "saving") {
        if (next.savingAccount === prevName) {
          next.savingAccount = nextName;
          touched = true;
        }
        if (
          next.accountName === prevName &&
          (next.accountType === "saving" || next.category === "Saving")
        ) {
          next.accountName = nextName;
          touched = true;
        }
      }
      if (touched) changed = true;
      return touched ? next : item;
    });

    if (!changed) return;
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

  const renameCurrentAccount = (index, nextName) => {
    const prevName = currentAccounts[index];
    if (!prevName || prevName === nextName) return;
    setCurrentAccounts((prev) =>
      prev.map((name, i) => (i === index ? nextName : name))
    );
    setSavingLinks((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((savingName) => {
        if (next[savingName] === prevName) {
          next[savingName] = nextName;
        }
      });
      return next;
    });
    setSelectedCurrentAccount((prev) =>
      prev === prevName ? nextName : prev
    );
    syncTransactionsAfterRename(prevName, nextName, "current");
  };

  const renameSavingAccount = (index, nextName) => {
    const prevName = savingAccounts[index];
    if (!prevName || prevName === nextName) return;
    setSavingAccounts((prev) =>
      prev.map((name, i) => (i === index ? nextName : name))
    );
    setSavingLinks((prev) => {
      const next = { ...prev };
      if (Object.prototype.hasOwnProperty.call(next, prevName)) {
        next[nextName] = next[prevName];
        delete next[prevName];
      } else {
        next[nextName] = currentAccounts[0] || "";
      }
      return next;
    });
    syncTransactionsAfterRename(prevName, nextName, "saving");
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
      const normalized = trimmed.toLowerCase();
      if (prev.some((item) => item.toLowerCase() === normalized)) {
        return prev;
      }
      return [...prev, trimmed];
    });
  };

  const renameCategory = (index, nextName) => {
    setCategories((prev) => {
      const trimmed = nextName.trim();
      if (!trimmed) return prev;
      const normalized = trimmed.toLowerCase();
      const current = prev[index] || "";
      if (
        prev.some(
          (item, i) => i !== index && item.toLowerCase() === normalized
        )
      ) {
        return prev;
      }
      if (current === trimmed) return prev;
      return prev.map((name, i) => (i === index ? trimmed : name));
    });
  };

  const deleteCategory = (index) => {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const sortCategories = React.useCallback((list) => {
    const items = Array.isArray(list) ? [...list] : [];
    const tailOrder = ["Salary", "Saving", "Account Transfer", "Other"];
    const tailSet = new Set(tailOrder.map((name) => name.toLowerCase()));
    const tailItems = [];
    const mainItems = [];
    items.forEach((item) => {
      const key = String(item).toLowerCase();
      if (tailSet.has(key)) {
        tailItems.push(item);
      } else {
        mainItems.push(item);
      }
    });
    mainItems.sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
    );
    const orderedTail = tailOrder
      .map((name) => tailItems.find((item) => String(item).toLowerCase() === name.toLowerCase()))
      .filter(Boolean);
    return [...mainItems, ...orderedTail];
  }, []);

  const sortedCategories = React.useMemo(() => {
    const base = Array.isArray(categories) && categories.length
      ? categories
      : DEFAULT_CATEGORIES;
    return sortCategories(base);
  }, [categories, sortCategories]);

  const mergedCategories = React.useMemo(() => {
    const base = Array.isArray(categories) && categories.length
      ? categories
      : DEFAULT_CATEGORIES;
    const set = new Set(base);
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return sortCategories(Array.from(set));
  }, [categories, transactions, sortCategories]);

  const recentTransactions = React.useMemo(() => {
    if (recentScope === "all") return transactions;
    const now = new Date();
    const year = now.getFullYear();
    return transactions.filter((t) => {
      const dt = new Date(t.date);
      if (Number.isNaN(dt.getTime())) return false;
      return dt.getFullYear() === year && dt.getMonth() === recentMonth;
    });
  }, [recentScope, recentMonth, transactions]);

  const recentDefaultDate = React.useMemo(() => {
    if (recentScope !== "month") return null;
    const now = new Date();
    const year = now.getFullYear();
    const firstDay = new Date(year, recentMonth, 1);
    return formatLocalDate(firstDay);
  }, [recentScope, recentMonth]);

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
      {updateStatus.status !== "idle" &&
        updateStatus.status !== "none" &&
        updateStatus.status !== "checking" && (
          <div className="update-banner" role="status">
            <div className="update-banner-text">
              {updateStatus.status === "available" && updateText.available}
              {updateStatus.status === "downloading" &&
                `${updateText.downloading}${
                  updateStatus.progress?.percent
                    ? ` (${Math.round(updateStatus.progress.percent)}%)`
                    : ""
                }`}
              {updateStatus.status === "downloaded" && updateText.downloaded}
              {updateStatus.status === "error" &&
                `${updateText.error}${
                  updateStatus.message ? `: ${updateStatus.message}` : ""
                }`}
            </div>
            {updateStatus.status === "downloaded" && (
              <button
                type="button"
                className="update-banner-action"
                onClick={() => window.comptaApi?.installUpdate?.()}
              >
                {updateText.restart}
              </button>
            )}
          </div>
        )}
      {showAccounts && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
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
              categories={sortedCategories}
              language={language}
              theme={theme}
              appVersion={appVersion}
              dataPathInfo={dataPathInfo}
              onSelectDataPath={handleSelectDataPath}
              onResetDataPath={handleResetDataPath}
              onOpenDataPath={handleOpenDataPath}
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
              defaultDate={recentDefaultDate}
            />
          </section>
          <section className="panel panel-list">
            <div className="panel-title-row">
              <h2 className="panel-title">{homeText.recentActivity}</h2>
              <div className="panel-toggle">
                <button
                  type="button"
                  className={`panel-toggle-btn${recentScope === "all" ? " is-active" : ""}`}
                  onClick={() => setRecentScope("all")}
                  aria-pressed={recentScope === "all"}
                >
                  {homeText.recentAll}
                </button>
                <button
                  type="button"
                  className={`panel-toggle-btn${recentScope === "month" ? " is-active" : ""}`}
                  onClick={() => setRecentScope("month")}
                  aria-pressed={recentScope === "month"}
                >
                  {homeText.recentMonth}
                </button>
              </div>
            </div>
            {recentScope === "month" && (
              <div className="panel-month">
                <select
                  value={recentMonth}
                  onChange={(e) => setRecentMonth(Number(e.target.value))}
                >
                  {monthLabels.map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <TransactionList
              transactions={recentTransactions}
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












