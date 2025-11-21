import { IAlphaVantageOutputObject } from "./DataFetcher";

export class DataAnalyzer {
  static takeDifferenceBetweenCurrentAndLastClose(
    data: IAlphaVantageOutputObject[]
  ): number {
    const last = data[0];
    const previous = data[1];
    const percentage =
      (100 * (Number(last["close"]) - Number(previous["close"]))) /
      Number(previous["close"]);
    return percentage;
  }
}
