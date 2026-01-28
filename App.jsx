import React, { useEffect, useState } from "react";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import ArchivePage from "./components/ArchivePage";
import StatsPage from "./components/StatsPage";
import AccountManager from "./components/AccountManager";
import Navigation from "./components/Navigation";

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [view, setView] = useState("home");
  const [currentAccounts, setCurrentAccounts] = useState([
    "Current account",
  ]);
  const [savingAccounts, setSavingAccounts] = useState([]);
  const [savingLinks, setSavingLinks] = useState({});
  const [language, setLanguage] = useState("fr");
  const [settingsMeta, setSettingsMeta] = useState({});
  const [showAccounts, setShowAccounts] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [selectedCurrentAccount, setSelectedCurrentAccount] = useState(
    "Current account"
  );

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

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      if (!window.comptaApi?.loadSettings) return;
      const settings = await window.comptaApi.loadSettings();
      if (cancelled || !settings?.accounts) return;
      const { accounts, ...rest } = settings;
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
      setSettingsMeta(rest);
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
    nextLanguage
  ) => {
    if (!window.comptaApi?.saveSettings) return;
    return window.comptaApi.saveSettings({
      ...settingsMeta,
      language: nextLanguage,
      accounts: {
        current: nextCurrent,
        saving: nextSaving,
        savingLinks: nextSavingLinks,
      },
    });
  };

  useEffect(() => {
    if (!accountsLoaded) return;
    persistAccounts(currentAccounts, savingAccounts, savingLinks, language);
  }, [accountsLoaded, currentAccounts, savingAccounts, savingLinks, language, settingsMeta]);

  useEffect(() => {
    if (!currentAccounts.length) return;
    setSelectedCurrentAccount((prev) =>
      currentAccounts.includes(prev) ? prev : currentAccounts[0]
    );
  }, [currentAccounts]);

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
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card panel">
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
              language={language}
              onAddCurrent={addCurrentAccount}
              onAddSaving={addSavingAccount}
              onRenameCurrent={renameCurrentAccount}
              onRenameSaving={renameSavingAccount}
              onDeleteCurrent={deleteCurrentAccount}
              onDeleteSaving={deleteSavingAccount}
              onLinkSaving={linkSavingAccount}
              onLanguageChange={setLanguage}
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
                <select
                  value={selectedCurrentAccount}
                  onChange={(e) => setSelectedCurrentAccount(e.target.value)}
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
            <TransactionForm
              onSubmit={handleAdd}
              currentAccounts={currentAccounts}
              savingAccounts={savingAccounts}
              selectedCurrentAccount={selectedCurrentAccount}
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
              language={language}
            />
          </section>
        </main>
      )}
    </div>
  );
}
