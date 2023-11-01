import Match from "./Match.mjs";

export default class TransactionLogic {
  sortTransactionsByDefaultOrder(transactions) {
    return transactions.sort((a, b) => {
      let d = a.ticker.localeCompare(b.ticker);
      if (d != 0) { return d }
      d = a.date.toISOString().localeCompare(b.date.toISOString());
      if (d != 0) { return d }
      return a.proceed_gbp - b.proceed_gbp;
    })
  }
  sortTransactionsByLogOrder(transactions) {
    return transactions.sort((a, b) => {
      let d = a.ticker.localeCompare(b.ticker);
      if (d != 0) { return d }
      d = a.date.toISOString().localeCompare(b.date.toISOString());
      if (d != 0) { return d }
      return b.proceed_gbp - a.proceed_gbp;
    })
  }
  computeMatches({ transactions, ticker }) {
    const transactionWrappers = this.sortTransactionsByDefaultOrder(
      transactions.filter(t => t.ticker === ticker)
    ).map(x => ({
      transaction: x,
      unmatchedShare: x.share,
    }));
    const disposals = transactionWrappers.filter(t => t.transaction.share < 0);
    for (var i = 0; i < disposals.length; ++i) {
      const disposalTime = disposals[i].transaction.date.getTime();
      const candidates = transactionWrappers.filter(
        t => t.unmatchedShare > 0 && disposalTime <= t.transaction.date.getTime() && t.transaction.date.getTime() <= disposalTime + 30 * 24 * 3600 * 1000
      )
      for (var j = 0; j < candidates.length; ++j) {
        const matchedShare = Math.min(candidates[j].unmatchedShare, -disposals[i].unmatchedShare);
        disposals[i].transaction.matches.push(
          new Match({
            transaction: candidates[j].transaction,
            share: matchedShare,
          })
        )
        candidates[j].transaction.matches.push(
          new Match({
            transaction: disposals[i].transaction,
            share: matchedShare,
          })
        )
        candidates[j].unmatchedShare -= matchedShare;
        disposals[i].unmatchedShare += matchedShare;
        if (disposals[i].unmatchedShare === 0) {
          break;
        }
      }
    }
    return transactions;
  }
  logCalculations({ transactions, ticker, pool }, { logger }) {
    const transactionsByTicker = this.sortTransactionsByLogOrder(
      transactions.filter(t => t.ticker === ticker)
    );
    for (const transaction of transactionsByTicker) {
      logger.log(transaction.toLogString());
      const indent = '  '
      if (transaction.share < 0) {
        let unmatchedShare = transaction.share;
        const costs = [];
        for (const match of transaction.matches) {
          logger.log(`${indent}${match.toLogString()}. ${match.toCostString()}`);
          costs.push(match.getCost());
          unmatchedShare += match.share;
        }
        if (unmatchedShare < 0) {
          costs.push(pool.getSellCost(-unmatchedShare))
          pool.sell(
            {
              share: -unmatchedShare
            },
            {
              logger: {
                log: (message) => {
                  logger.log(`${indent}${message}`);
                }
              }
            }
          );
        }
        if (costs.length > 1) {
          console.log(`${indent}Total cost for this disposal=${costs.map(x => x.toFixed(2)).join("+")}=£${costs.reduce((a, b) => a + b, 0).toFixed(2)}`);
        } else if (costs.length === 1) {
          console.log(`${indent}Total cost for this disposal=£${costs.reduce((a, b) => a + b, 0).toFixed(2)}`);
        }
      }
      if (transaction.share > 0) {
        let unmatchedShare = transaction.share;
        for (const match of transaction.matches) {
          unmatchedShare -= match.share;
        }
        if (unmatchedShare > 0) {
          console.log(`${indent}There are ${unmatchedShare} ${transaction.ticker} not matched.`);
          pool.buy(
            {
              share: unmatchedShare,
              totalCost: -(transaction.proceed_gbp - transaction.comission_gbp),
              totalShare: Math.abs(transaction.share),
            },
            {
              logger: {
                log: (message) => {
                  logger.log(`${indent}${message}`);
                }
              }
            }
          );
        }
      }
    }
  }
}