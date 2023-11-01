export default class Transaction {
  ticker;
  date;
  share;
  proceed_gbp;
  comission_gbp;
  matches = [];
  constructor({ ticker, date, share, proceed_gbp, comission_gbp }) {
    this.ticker = ticker;
    this.date = date;
    this.share = share;
    this.proceed_gbp = proceed_gbp;
    this.comission_gbp = comission_gbp;
  }
  toLogString() {
    if (this.share < 0) {
      return `SELL ${-this.share} ${this.ticker} for £${Math.abs(this.proceed_gbp - this.comission_gbp).toFixed(2)} on ${this.date.toISOString().split("T")[0]}`
    } else {
      return `BUY ${this.share} ${this.ticker} for £${Math.abs(this.proceed_gbp - this.comission_gbp).toFixed(2)} on ${this.date.toISOString().split("T")[0]}`
    }
  }
}