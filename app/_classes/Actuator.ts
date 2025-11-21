import { DataAnalyzer } from "./DataAnalyzer";
import { DataFetcher, Frequencies } from "./DataFetcher";
import { MailSender } from "./MailSender";
import { ReportCreator } from "./ReportCreator";
import { ITickerRecord } from "./TickerRecord";

type GetStockDataAnalyzeAndReport = {
  frequency: Frequencies;
  stocks: ITickerRecord[];
  cutoff: number;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Actuator {
  static async getStockDataAnalyzeAndReport(
    input: GetStockDataAnalyzeAndReport
  ) {
    const { stocks, frequency, cutoff } = input;
    const reportInputs = [];

    for (const stock of stocks) {
      const stockData = await DataFetcher.fetchData(frequency, stock.ticker);
      const change =
        DataAnalyzer.takeDifferenceBetweenCurrentAndLastClose(stockData);
      reportInputs.push({
        change: change,
        cutoffChange: cutoff,
        stock: stock,
      });
      if (stocks.indexOf(stock) < stocks.length - 1) {
        //alphavantage allows max 5 requests for free
        // so each run is delayed for one minute
        await delay(60000);
      }
    }

    MailSender.send(
      ReportCreator.generateReportListBasedOnPriceChange(reportInputs),
      `${input.frequency} report for stocks`
    );
  }
}
