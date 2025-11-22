import { ITickerRecord } from "./TickerRecord";

type ReportArrayInput = {
  change: number;
  cutoffChange: number;
  stock: ITickerRecord;
};

export class ReportCreator {
  static generateReportBasedOnPriceChange(entry: ReportArrayInput): string {
    const { change, cutoffChange } = entry;
    if (Math.abs(change) > cutoffChange) {
      return `${ReportCreator.generateReportAllStocks(
        entry.stock
      )} changed price by ${change.toFixed(2)} %, \n`;
    } else {
      return "";
    }
  }

  static generateReportAllStocks(entry: ITickerRecord): string {
    const { ticker, comment } = entry;
    return `${comment} ${ticker}`;
  }

  static generateReportListBasedOnPriceChange(
    input: ReportArrayInput[]
  ): string {
    return input
      .map((entry) => this.generateReportBasedOnPriceChange(entry))
      .join();
  }

  static generateReportListAllStocks(input: ITickerRecord[]): string {
    return input.map((entry) => this.generateReportAllStocks(entry)).join("\n");
  }
}
