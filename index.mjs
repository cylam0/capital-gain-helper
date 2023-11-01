import TransactionLoader from "./class/TransactionLoader.mjs";
import TransactionLogic from "./class/TransactionLogic.mjs";
import TransactionPool from "./class/TransactionPool.mjs";

const transactionLogic = new TransactionLogic()

const transactions = new TransactionLoader().load("./data/transactions.csv");

const ticker = "VUSD";

transactionLogic.computeMatches({ transactions, ticker });

transactionLogic.logCalculations(
  {
    transactions,
    ticker,
    pool: new TransactionPool({
      ticker,
      share: 0,
      cost: 0,
    })
  },
  { logger: console }
);