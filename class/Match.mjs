export default class Match {
  transaction;
  share;
  constructor({ transaction, share }) {
    this.transaction = transaction;
    this.share = share;
  }
  getCost() {
    return Math.round(-(this.transaction.proceed_gbp - this.transaction.comission_gbp) * this.share / this.transaction.share * 100) / 100
  }
  toCostString() {
    return `Cost=${-(this.transaction.proceed_gbp - this.transaction.comission_gbp)}*${this.share}/${this.transaction.share}=£${this.getCost()}`
  }
  toLogString() {
    if (this.transaction.share < 0) {
      return `Matches with ${this.share} ${this.transaction.ticker} sold on ${this.transaction.date.toISOString().split("T")[0]}`
    }
    return `Matches with ${this.share} ${this.transaction.ticker} bought on ${this.transaction.date.toISOString().split("T")[0]}`
  }
}