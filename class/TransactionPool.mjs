export default class TransactionPool {
  ticker;
  share;
  cost;
  constructor({ ticker, share, cost }) {
    this.ticker = ticker;
    this.share = share;
    this.cost = cost;
  }
  buy({ share, totalCost, totalShare }, { logger }) {
    const cost = Math.round(totalCost * share / totalShare * 100) / 100
    logger.log(`In Section 104 of ${this.ticker}, number of shares becomes ${this.share}+${share}=${this.share + share} and cost becomes ${this.cost}+${totalCost.toFixed(2)}*${share}/${totalShare}=£${(this.cost + cost).toFixed(2)}.`)
    this.share += share
    this.cost += cost
  }
  getSellCost(share) {
    return Math.round(this.cost * share / this.share * 100) / 100
  }
  sell({ share }, { logger }) {
    const cost = Math.round(this.cost * share / this.share * 100) / 100
    logger.log(
      `Sell ${share} ${this.ticker} in Section 104. Cost=${this.cost.toFixed(2)}*${share}/${this.share}=£${(cost).toFixed(2)}`
    )
    logger.log(`In Section 104 of ${this.ticker}, number of shares becomes ${this.share}-${share}=${this.share - share} and cost becomes ${this.cost.toFixed(2)}-${cost}=£${(this.cost - cost).toFixed(2)}.`)
    this.share -= share
    this.cost -= cost
  }
}