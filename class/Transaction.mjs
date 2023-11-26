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
}