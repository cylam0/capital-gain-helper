import fs from "fs";
import path from "path";
import Transaction from "./Transaction.mjs";

export default class TransactionLoader {
  load(filePath) {
    // load and parse files
    const data = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
    const lines = data.split("\n");
    const transactions = [];
    const header = lines[0].split(",")
    const fieldIndexLookup = {};
    for (var i = 0; i < header.length; ++i) {
      fieldIndexLookup[header[i]] = i;
    }

    for (var i = 1; i < lines.length; ++i) {
      const line = lines[i];
      const fields = line.split(",");
      const transaction = new Transaction({
        ticker: fields[fieldIndexLookup['ticker']],
        date: new Date(fields[fieldIndexLookup['date']]),
        share: Number(fields[fieldIndexLookup['share']]),
        proceed_gbp: Number(fields[fieldIndexLookup['proceed_gbp']]),
        comission_gbp: Number(fields[fieldIndexLookup['comission_gbp']]),
      });
      transactions.push(transaction);
    }
    transactions.sort((a, b) => {
      let d = a.ticker.localeCompare(b.ticker);
      if (d != 0) { return d }
      d = a.date.toISOString().localeCompare(b.date.toISOString());
      if (d != 0) { return d }
      return a.proceed_gbp - b.proceed_gbp;
    })
    return transactions;
  }
};