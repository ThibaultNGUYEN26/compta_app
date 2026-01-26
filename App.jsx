import React, { useEffect, useState } from "react";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import ArchivePage from "./components/ArchivePage";
import StatsPage from "./components/StatsPage";
import AccountManager from "./components/AccountManager";

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [view, setView] = useState("home");
  const [currentAccounts, setCurrentAccounts] = useState([
    "Current account",
  ]);
  const [savingAccounts, setSavingAccounts] = useState([]);
  const [showAccounts, setShowAccounts] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      if (!window.comptaApi?.loadSettings) return;
      const settings = await window.comptaApi.loadSettings();
      if (cancelled || !settings?.accounts) return;
      setCurrentAccounts(
        Array.isArray(settings.accounts.current) &&
          settings.accounts.current.length
          ? settings.accounts.current
          : ["Current account"]
      );
      setSavingAccounts(
        Array.isArray(settings.accounts.saving)
          ? settings.accounts.saving
          : []
      );
      setAccountsLoaded(true);
    };
    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistAccounts = (nextCurrent, nextSaving) => {
    if (!window.comptaApi?.saveSettings) return;
    return window.comptaApi.saveSettings({
      accounts: {
        current: nextCurrent,
        saving: nextSaving,
      },
    });
  };

  useEffect(() => {
    if (!accountsLoaded) return;
    persistAccounts(currentAccounts, savingAccounts);
  }, [accountsLoaded, currentAccounts, savingAccounts]);

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
  };

  const deleteCurrentAccount = (index) => {
    setCurrentAccounts((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const deleteSavingAccount = (index) => {
    setSavingAccounts((prev) =>
      prev.filter((_, i) => i !== index)
    );
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
        <div>
          <p className="app-eyebrow">Personal finance</p>
          <h1 className="app-title">Compta</h1>
        </div>
        <div className="app-actions">
          <div className="app-nav">
            <button
              type="button"
              className={`nav-button ${view === "home" ? "is-active" : ""}`}
              onClick={() => setView("home")}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`nav-button ${view === "archive" ? "is-active" : ""}`}
            onClick={() => setView("archive")}
          >
            Archive
          </button>
          <button
            type="button"
            className={`nav-button ${view === "stats" ? "is-active" : ""}`}
            onClick={() => setView("stats")}
            >
              Stats
            </button>
          </div>
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
              <h2 className="panel-title">Accounts</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAccounts(false)}
              >
                Close
              </button>
            </div>
            <AccountManager
              currentAccounts={currentAccounts}
              savingAccounts={savingAccounts}
              onAddCurrent={addCurrentAccount}
              onAddSaving={addSavingAccount}
              onRenameCurrent={renameCurrentAccount}
              onRenameSaving={renameSavingAccount}
              onDeleteCurrent={deleteCurrentAccount}
              onDeleteSaving={deleteSavingAccount}
            />
          </div>
        </div>
      )}
      {view === "home" ? (
        <main className="app-grid">
          <section className="panel panel-form">
            <h2 className="panel-title">New transaction</h2>
            <TransactionForm
              onSubmit={handleAdd}
              currentAccounts={currentAccounts}
              savingAccounts={savingAccounts}
            />
          </section>
          <section className="panel panel-list">
            <h2 className="panel-title">Recent activity</h2>
            <TransactionList
              transactions={transactions}
              limit={4}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              currentAccounts={currentAccounts}
              savingAccounts={savingAccounts}
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
        />
      ) : (
        <main className="app-stats">
          <section className="panel panel-stats">
            <StatsPage transactions={transactions} />
          </section>
        </main>
      )}
    </div>
  );
}
