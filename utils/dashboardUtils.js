/**
 * Dashboard data aggregation utilities
 * Following strict accounting rules for personal finance tracking
 */

/**
 * Check if transaction is a saving transfer (internal movement)
 */
export const isSavingTransfer = (transaction) => {
  return transaction.category === "Saving" && transaction.savingAccount;
};

/**
 * Check if transaction is a transfer between current accounts
 */
export const isCurrentTransfer = (transaction) => {
  return (
    (transaction.category === "Account Transfer" ||
      transaction.category === "Transfer") &&
    transaction.transferAccount
  );
};

/**
 * Check if transaction is real income (external only)
 */
export const isRealIncome = (transaction) => {
  return (
    transaction.type === "income" &&
    !isSavingTransfer(transaction) &&
    !isCurrentTransfer(transaction)
  );
};

/**
 * Check if transaction is real outcome (external only)
 */
export const isRealOutcome = (transaction) => {
  return (
    transaction.type === "expense" &&
    !isSavingTransfer(transaction) &&
    !isCurrentTransfer(transaction)
  );
};

/**
 * Filter transactions by date range
 */
export const filterByDateRange = (transactions, year, month = null) => {
  return transactions.filter((t) => {
    const date = new Date(t.date);
    if (isNaN(date.getTime())) return false;
    
    const matchesYear = date.getFullYear() === Number(year);
    if (month === null || month === "") return matchesYear;
    
    return matchesYear && date.getMonth() === Number(month);
  });
};

/**
 * Filter transactions by scope (account)
 */
export const filterByScope = (transactions, scopeType, scopeName, savingLinks = {}) => {
  if (scopeType === "all") return transactions;
  
  return transactions.filter((t) => {
    if (scopeType === "current") {
      if (isSavingTransfer(t)) {
        if (!scopeName) return true;
        return t.savingAccount && savingLinks[t.savingAccount] === scopeName;
      }
      if (isCurrentTransfer(t)) {
        if (!scopeName) return true;
        return (
          t.currentAccount === scopeName || t.transferAccount === scopeName
        );
      }
      if (!scopeName) return true;
      return t.currentAccount === scopeName;
    }
    if (scopeType === "saving") {
      return t.savingAccount === scopeName;
    }
    return true;
  });
};

/**
 * Compute KPIs following accounting rules
 */
export const computeKpis = (transactions, accounts, scope = {}) => {
  // Real income/outcome (external only, excluding saving transfers)
  let realIncome = 0;
  let realIncomeCount = 0;
  let realOutcome = 0;
  let realOutcomeCount = 0;

  // Savings internal movements
  let savingsDeposits = 0;
  let savingsDepositsCount = 0;
  let savingsWithdrawals = 0;
  let savingsWithdrawalsCount = 0;

  // Prelevements (subset of real outcome)
  let prelevTotal = 0;
  let prelevCount = 0;
  let currentTransfersIn = 0;
  let currentTransfersOut = 0;
  let currentTransfersInCount = 0;
  let currentTransfersOutCount = 0;

  for (const t of transactions) {
    const amount = Math.abs(Number(t.amount) || 0);
    const isTransfer = isSavingTransfer(t);
    const isCurrentMove = isCurrentTransfer(t);

    if (isTransfer) {
      // Internal savings movement
      if (t.type === "expense") {
        savingsDeposits += amount;
        savingsDepositsCount++;
      } else if (t.type === "income") {
        savingsWithdrawals += amount;
        savingsWithdrawalsCount++;
      }
    } else if (isCurrentMove) {
      if (scope?.type === "current" && scope?.name) {
        if (t.currentAccount === scope.name) {
          currentTransfersOut += amount;
          currentTransfersOutCount++;
          realOutcome += amount;
          realOutcomeCount++;
        } else if (t.transferAccount === scope.name) {
          currentTransfersIn += amount;
          currentTransfersInCount++;
          realIncome += amount;
          realIncomeCount++;
        }
      } else if (scope?.type === "current") {
        currentTransfersOut += amount;
        currentTransfersOutCount++;
        currentTransfersIn += amount;
        currentTransfersInCount++;
        realOutcome += amount;
        realOutcomeCount++;
        realIncome += amount;
        realIncomeCount++;
      }
    } else {
      // Real external transactions
      if (t.type === "income") {
        realIncome += amount;
        realIncomeCount++;
      } else if (t.type === "expense") {
        realOutcome += amount;

        if (t.isPrelevement) {
          prelevTotal += amount;
          prelevCount++;
        } else {
          realOutcomeCount++;
        }
      }
    }
  }

  const realNet = realIncome - realOutcome;
  const savingsNetChange = savingsDeposits - savingsWithdrawals;
  const savingsRate = realIncome > 0 ? (savingsDeposits / realIncome) * 100 : 0;

  const savingsBalance = savingsDeposits - savingsWithdrawals;
  // Account balances (these would need to be calculated from initial balances + transactions)
  // For now, current balance is (income - expense) minus savings balance.
  const currentBalance = realIncome - realOutcome - savingsBalance;
  const totalBalance = currentBalance + savingsBalance;

  return {
    currentBalance,
    savingsBalance,
    totalBalance,
    realIncome,
    realIncomeCount,
    realOutcome,
    realOutcomeCount,
    realNet,
    savingsDeposits,
    savingsDepositsCount,
    savingsWithdrawals,
    savingsWithdrawalsCount,
    savingsNetChange,
    prelevTotal,
    prelevCount,
    savingsRate,
    currentTransfersIn,
    currentTransfersOut,
    currentTransfersInCount,
    currentTransfersOutCount,
  };
};

/**
 * Compute monthly income/outcome series for a year
 */
export const computeMonthlySeries = (transactions, year) => {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    realIncome: 0,
    realOutcome: 0,
    realPrelevement: 0,
    realNet: 0,
  }));

  for (const t of transactions) {
    const date = new Date(t.date);
    if (isNaN(date.getTime())) continue;
    if (date.getFullYear() !== Number(year)) continue;

    const monthIndex = date.getMonth();
    const amount = t.amount || 0;

    if (isRealIncome(t)) {
      months[monthIndex].realIncome += amount;
    } else if (isRealOutcome(t)) {
      months[monthIndex].realOutcome += amount;
      if (t.isPrelevement) {
        months[monthIndex].realPrelevement += amount;
      }
    }
  }

  months.forEach((m) => {
    m.realNet = m.realIncome - m.realOutcome;
  });

  return months;
};

/**
 * Compute daily net for a specific month
 */
export const computeDailyNetSeries = (transactions, year, month) => {
  const daysInMonth = new Date(Number(year), Number(month) + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    realIncome: 0,
    realOutcome: 0,
    realNet: 0,
    transactions: [],
  }));

  for (const t of transactions) {
    const date = new Date(t.date);
    if (isNaN(date.getTime())) continue;
    if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month)) continue;

    const dayIndex = date.getDate() - 1;
    const amount = t.amount || 0;

    days[dayIndex].transactions.push(t);

    if (isRealIncome(t)) {
      days[dayIndex].realIncome += amount;
    } else if (isRealOutcome(t)) {
      days[dayIndex].realOutcome += amount;
    }
  }

  days.forEach((d) => {
    d.realNet = d.realIncome - d.realOutcome;
  });

  return days;
};

/**
 * Compute category breakdown (real outcome only)
 */
export const computeCategoryBreakdown = (transactions) => {
  const categories = {};

  for (const t of transactions) {
    if (!isRealOutcome(t)) continue;

    const category = t.category || "Other";
    if (!categories[category]) {
      categories[category] = { total: 0, count: 0 };
    }

    categories[category].total += t.amount || 0;
    categories[category].count++;
  }

  return Object.entries(categories)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);
};

/**
 * Compute prelevement breakdown by merchant/name
 */
export const computePrelevementBreakdown = (transactions) => {
  const merchants = {};

  for (const t of transactions) {
    if (!t.isPrelevement || !isRealOutcome(t)) continue;

    const name = t.name || "Unknown";
    if (!merchants[name]) {
      merchants[name] = { total: 0, count: 0 };
    }

    merchants[name].total += t.amount || 0;
    merchants[name].count++;
  }

  return Object.entries(merchants)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);
};

/**
 * Compute savings by saving account
 */
export const computeSavingsBySavingAccount = (
  transactions,
  scope = {},
  savingLinks = {}
) => {
  const accounts = {};

  const matchesScope = (transaction) => {
    if (!scope?.type || scope.type === "all") return true;
    if (scope.type === "saving") {
      return !scope.name || transaction.savingAccount === scope.name;
    }
    if (scope.type === "current") {
      if (!scope.name) return true;
      const linkedCurrent = savingLinks[transaction.savingAccount];
      if (linkedCurrent) return linkedCurrent === scope.name;
      return transaction.currentAccount === scope.name;
    }
    return true;
  };

  for (const t of transactions) {
    if (!isSavingTransfer(t)) continue;
    if (!matchesScope(t)) continue;

    const account = t.savingAccount || "Unknown";
    if (!accounts[account]) {
      accounts[account] = { deposits: 0, withdrawals: 0, netChange: 0 };
    }

    const amount = t.amount || 0;
    if (t.type === "expense") {
      accounts[account].deposits += amount;
    } else if (t.type === "income") {
      accounts[account].withdrawals += amount;
    }
  }

  Object.values(accounts).forEach((acc) => {
    acc.netChange = acc.deposits - acc.withdrawals;
  });

  return Object.entries(accounts).map(([name, data]) => ({ name, ...data }));
};

/**
 * Compute account balances breakdown
 */
export const computeAccountBalances = (transactions, currentAccounts, savingAccounts) => {
  const currentBalances = {};
  const savingBalances = {};

  // Initialize accounts
  currentAccounts.forEach((name) => {
    currentBalances[name] = 0;
  });
  savingAccounts.forEach((name) => {
    savingBalances[name] = 0;
  });

  // Calculate net from transactions
  for (const t of transactions) {
    const amount = t.amount || 0;
    const isTransfer = isSavingTransfer(t);

    if (isTransfer) {
      const savingAcc = t.savingAccount;
      const currentAcc = t.currentAccount;
      
      if (t.type === "expense") {
        // Moving to savings
        if (currentAcc && currentBalances[currentAcc] !== undefined) {
          currentBalances[currentAcc] -= amount;
        }
        if (savingAcc && savingBalances[savingAcc] !== undefined) {
          savingBalances[savingAcc] += amount;
        }
      } else {
        // Withdrawing from savings
        if (savingAcc && savingBalances[savingAcc] !== undefined) {
          savingBalances[savingAcc] -= amount;
        }
        if (currentAcc && currentBalances[currentAcc] !== undefined) {
          currentBalances[currentAcc] += amount;
        }
      }
    } else if (isCurrentTransfer(t)) {
      const fromAccount = t.currentAccount || currentAccounts[0];
      const toAccount = t.transferAccount || currentAccounts[0];
      if (fromAccount && currentBalances[fromAccount] !== undefined) {
        currentBalances[fromAccount] -= amount;
      }
      if (toAccount && currentBalances[toAccount] !== undefined) {
        currentBalances[toAccount] += amount;
      }
    } else {
      const account = t.currentAccount || currentAccounts[0];
      if (currentBalances[account] !== undefined) {
        if (t.type === "income") {
          currentBalances[account] += amount;
        } else {
          currentBalances[account] -= amount;
        }
      }
    }
  }

  return {
    current: Object.entries(currentBalances).map(([name, balance]) => ({ name, balance })),
    saving: Object.entries(savingBalances).map(([name, balance]) => ({ name, balance })),
  };
};

/**
 * Compute daily expenses for a given period
 * Groups expenses by day and returns array of {day, amount}
 */
export const computeDailyExpenses = (transactions) => {
  const dailyMap = {};
  
  transactions.forEach((t) => {
    // Only count real expenses (not savings transfers)
    if (t.type !== "expense" || isSavingTransfer(t) || isCurrentTransfer(t)) return;
    
    const date = new Date(t.date);
    if (isNaN(date.getTime())) return;
    
    const day = date.getDate();
    const amount = t.amount || 0;
    
    if (!dailyMap[day]) {
      dailyMap[day] = 0;
    }
    dailyMap[day] += amount;
  });
  
  // Convert to array and sort by day
  return Object.entries(dailyMap)
    .map(([day, amount]) => ({ day: Number(day), amount }))
    .sort((a, b) => a.day - b.day);
};
