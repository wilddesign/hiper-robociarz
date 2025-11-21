import { ITickerRecord } from "./TickerRecord";

type ReportArrayInput = {
  change: number;
  cutoffChange: number;
  stock: ITickerRecord;
};

export class ReportCreator {
  static generateReportBasedOnPriceChange(entry: ReportArrayInput): string {
    const { change, cutoffChange, stock } = entry;
    if (Math.abs(change) > cutoffChange) {
      return `${stock.comment} ${
        stock.ticker
      } changed price by ${change.toFixed(2)} %, `;
    } else {
      return "";
    }
  }

  static generateReportListBasedOnPriceChange(
    input: ReportArrayInput[]
  ): string {
    return input
      .map((entry) => this.generateReportBasedOnPriceChange(entry))
      .join("\n");
  }
}
