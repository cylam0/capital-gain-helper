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
  logCalculations({ transactions, ticker, pool }, { transactionLogic, logger }) {
    const transactionsByTicker = transactionLogic.sortTransactionsByLogOrder(
      transactions.filter(t => t.ticker === ticker)
    );
    for (const transaction of transactionsByTicker) {
      transactionLogic.logTransaction({ transaction }, { logger });
      const indent = '  '
      if (transaction.share < 0) {
        let unmatchedShare = transaction.share;
        const costs = [];
        for (const match of transaction.matches) {
          transactionLogic.logMatch({ match, indent }, { logger });
          costs.push(match.getCost());
          unmatchedShare += match.share;
        }
        if (unmatchedShare < 0) {
          costs.push(pool.getSellCost(-unmatchedShare))
          transactionLogic.logPoolDisposal({ pool, share: -unmatchedShare, indent }, { logger })
          pool.sell({ share: -unmatchedShare });
        }
        transactionLogic.logDisposalCost({ costs, indent }, { logger });
        transactionLogic.logDisposalGain({ transaction, costs, indent }, { logger })
      } else if (transaction.share > 0) {
        let unmatchedShare = transaction.share;
        for (const match of transaction.matches) {
          unmatchedShare -= match.share;
        }
        if (unmatchedShare > 0) {
          if (transaction.matches.length > 0) {
            logger.log(`${indent}Unmatched shares=${unmatchedShare} ${transaction.ticker}.`);
          }
          transactionLogic.logPoolPurchase({
            pool,
            share: unmatchedShare,
            totalCost: -(transaction.proceed_gbp - transaction.comission_gbp),
            totalShare: Math.abs(transaction.share),
            indent
          }, { logger })
          pool.buy(
            {
              share: unmatchedShare,
              totalCost: -(transaction.proceed_gbp - transaction.comission_gbp),
              totalShare: Math.abs(transaction.share),
            }
          );
        }
      }
    }
  }
  logDisposalCost({ costs, indent }, { logger }) {
    if (costs.length > 1) {
      const costExpression = costs.map(x => x.toFixed(2)).join("+")
      const totalCost = costs.reduce((a, b) => a + b, 0).toFixed(2)
      logger.log(`${indent}Disposal cost=${costExpression}=£${totalCost}`);
    } else if (costs.length === 1) {
      logger.log(`${indent}Disposal cost=£${costs[0].toFixed(2)}`);
    }
  }
  logDisposalGain({ transaction: t, costs, indent }, { logger }) {
    const totalCost = costs.reduce((a, b) => a + b, 0);
    const gain = (t.proceed_gbp - t.comission_gbp - totalCost).toFixed(2)
    if (gain >= 0) {
      logger.log(indent +
        `Chargable gain=${Math.abs(t.proceed_gbp - t.comission_gbp).toFixed(2)}-${totalCost.toFixed(2)}=£${gain}`
      )
    } else {
      logger.log(indent +
        `Allowable loss=${totalCost.toFixed(2)}-${Math.abs(t.proceed_gbp - t.comission_gbp).toFixed(2)}=£${-gain}`
      )
    }
  }
  logMatch({ match: m, indent = '' }, { logger }) {
    const costDesc = `Cost=${-(m.transaction.proceed_gbp - m.transaction.comission_gbp).toFixed(2)}*${m.share}/${m.transaction.share}=£${m.getCost().toFixed(2)}`
    if (m.transaction.share < 0) {
      logger.log(indent + `Matches with ${m.share} ${m.transaction.ticker} sold on ${m.transaction.date.toISOString().split("T")[0]}. ${costDesc}`)
      return;
    }
    logger.log(indent + `Matches with ${m.share} ${m.transaction.ticker} bought on ${m.transaction.date.toISOString().split("T")[0]}. ${costDesc}`)
  }
  logPoolDisposal({ pool: p, share, indent }, { logger }) {
    const finalCost = p.cost.toFixed(2) * share / p.share
    logger.log(indent +
      `Matches with ${share} ${p.ticker} in Section 104. Cost=${p.cost.toFixed(2)}*${share}/${p.share}=£${finalCost.toFixed(2)}`
    )
    logger.log(indent +
      `In Section 104, number of shares becomes ${p.share}-${share}=${p.share - share} and cost becomes ${p.cost.toFixed(2)}-${finalCost.toFixed(2)}=£${(p.cost - finalCost).toFixed(2)}.`
    )
  }
  logPoolPurchase({ pool: p, share, totalCost, totalShare, indent = '' }, { logger }) {
    const cost = Math.round(totalCost * share / totalShare * 100) / 100
    logger.log(indent + `In Section 104, number of shares becomes ${p.share}+${share}=${p.share + share} and cost becomes ${p.cost.toFixed(2)}+${totalCost.toFixed(2)}*${share}/${totalShare.toFixed(2)}=£${(p.cost + cost).toFixed(2)}.`)
  }
  logTransaction({ transaction: t, indent = '' }, { logger }) {
    if (t.share < 0) {
      logger.log(indent + `SELL ${-t.share} ${t.ticker} for £${Math.abs(t.proceed_gbp - t.comission_gbp).toFixed(2)} on ${t.date.toISOString().split("T")[0]}`)
    } else {
      logger.log(indent + `BUY ${t.share} ${t.ticker} for £${Math.abs(t.proceed_gbp - t.comission_gbp).toFixed(2)} on ${t.date.toISOString().split("T")[0]}`)
    }
  }
}