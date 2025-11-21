const axios = require("axios");
import { parseCsvToObject } from "./TickerRecord";
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export enum Frequencies {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
}

export interface IAlphaVantageOutputObject {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export class DataFetcher {
  static url: string = `https://www.alphavantage.co/query?function=TIME_SERIES_{frequency}&symbol={ticker}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=compact&datatype=csv`;
  static prepareUrl(frequency: Frequencies, ticker: string) {
    return this.url
      .replace("{frequency}", frequency as string)
      .replace("{ticker}", ticker);
  }

  static async fetchData(frequency: Frequencies, ticker: string) {
    const response = await axios.get(this.prepareUrl(frequency, ticker), {
      responseType: "blob",
    });
    return parseCsvToObject<IAlphaVantageOutputObject>(response.data);
  }
}
