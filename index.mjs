import fs from 'fs';

import TransactionLoader from "./class/TransactionLoader.mjs";
import TransactionLogic from "./class/TransactionLogic.mjs";
import TransactionPool from "./class/TransactionPool.mjs";

const transactionLogic = new TransactionLogic()

const transactions = new TransactionLoader().load("./data/transactions.csv");

const disposedTickers = Array.from(new Set([
  ...transactions.filter(t => t.share < 0)
    .map(x => x.ticker)
]))

const outputFilePath = './output.txt';

const logger = {
  log(x) {
    fs.writeFileSync(outputFilePath, x + '\n', { flag: 'a' });
  }
}

fs.writeFileSync(outputFilePath, '', { flag: 'w' });

for (const ticker of disposedTickers) {
  transactionLogic.computeMatches({ transactions, ticker });
  logger.log('\n');
  logger.log(`Computations for ${ticker}\n`);
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
    {
      transactionLogic,
      logger
    }
  )
};
