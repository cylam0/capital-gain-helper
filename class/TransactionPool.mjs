export default class TransactionPool {
  ticker;
  share;
  cost;
  constructor({ ticker, share, cost }) {
    this.ticker = ticker;
    this.share = share;
    this.cost = cost;
  }
  buy({ share, totalCost, totalShare }) {
    const cost = Math.round(totalCost * share / totalShare * 100) / 100
    this.share += share
    this.cost += cost
  }
  getSellCost(share) {
    return Math.round(this.cost * share / this.share * 100) / 100
  }
  sell({ share }) {
    const cost = Math.round(this.cost * share / this.share * 100) / 100
    this.share -= share
    this.cost -= cost
  }
}