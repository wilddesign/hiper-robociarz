const axios = require("axios");
import { parseCsvToObject } from "./TickerRecord";
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export enum Frequencies {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

export enum FrequenciesStooq {
  DAILY = "d",
  WEEKLY = "w",
  MONTHLY = "m",
  QUARTERLY = "q",
  YEARLY = "y",
}

/**
 * A constant mapping object for performing the transformation.
 * This is more readable and maintainable than a long switch statement.
 */
const FREQUENCY_MAPPING: Record<Frequencies, FrequenciesStooq> = {
  [Frequencies.DAILY]: FrequenciesStooq.DAILY, // "DAILY" -> "d"
  [Frequencies.WEEKLY]: FrequenciesStooq.WEEKLY, // "WEEKLY" -> "w"
  [Frequencies.MONTHLY]: FrequenciesStooq.MONTHLY, // "MONTHLY" -> "m"
  [Frequencies.QUARTERLY]: FrequenciesStooq.QUARTERLY, // "QUARTERLY" -> "q"
  [Frequencies.YEARLY]: FrequenciesStooq.YEARLY, // "YEARLY" -> "y"
};

/**
 * Transforms a value from the standard Frequencies enum to the Stooq-specific
 * FrequenciesStooq enum using a lookup map.
 *
 * @param frequency The standard frequency value (e.g., Frequencies.WEEKLY).
 * @returns The corresponding Stooq frequency value (e.g., FrequenciesStooq.WEEKLY).
 * @throws Error if an unknown frequency value is passed.
 */
export function mapFrequencyToStooq(frequency: Frequencies): FrequenciesStooq {
  const stooqFrequency = FREQUENCY_MAPPING[frequency];

  if (!stooqFrequency) {
    // This is a safety check in case the input is a string that doesn't
    // correspond to a defined enum value, although TypeScript usually prevents this.
    throw new Error(`Unknown frequency value: ${frequency}`);
  }

  return stooqFrequency;
}

const STOOQ_BASE_URL = "https://stooq.pl/q/d/l/";

export interface IStooqOutputObject {
  data: string;
  otwarcie: string;
  najwyzszy: string;
  najnizszy: string;
  zamkniecie: string;
  wolumen: string;
}

export interface IAlphaVantageOutputObject {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

/**
 * Maps a single data object from the Stooq format to the standard
 * Alpha Vantage format.
 *
 * @param stooqData The object using Polish field names (Stooq format).
 * @returns The object using English field names (Alpha Vantage format).
 */
export function mapStooqToAlphaVantage(
  stooqData: IStooqOutputObject
): IAlphaVantageOutputObject {
  // Directly map the properties based on their meaning:
  return {
    timestamp: stooqData.data,
    open: stooqData.otwarcie,
    high: stooqData.najwyzszy,
    low: stooqData.najnizszy,
    close: stooqData.zamkniecie,
    volume: stooqData.wolumen,
  };
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

  static async fetchDataStooq(frequency: Frequencies, ticker: string) {
    const url = generateStooqUrlBase(ticker, mapFrequencyToStooq(frequency));
    const response = await axios.get(url, {
      responseType: "blob",
    });
    return parseCsvToObject<IStooqOutputObject>(response.data)
      .map(mapStooqToAlphaVantage)
      .reverse();
  }
}

// --- Base Function for URL Generation ---

/**
 * Helper function to format a Date object into Stooq's required YYYYMMDD string format.
 */
function formatDate(date: Date): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}${m}${d}`; // e.g., "20231124"
}

/**
 * Generates a Stooq.pl historical data URL with a specific interval and time window.
 *
 * NOTE on sessions (c=): The 'c' parameter limits the number of rows returned,
 * which is used here to meet the "last two sessions" default requirement.
 *
 * @param ticker Stock symbol (e.g., 'agl').
 * @param interval The desired data frequency (FrequenciesStooq). Defaults to DAILY ('d').
 * @param sessions The number of sessions/rows to display, corresponding to the '&c=' parameter. Defaults to 2 (last two sessions).
 * @returns The constructed Stooq.pl URL.
 */
export function generateStooqUrlBase(
  ticker: string,
  interval: FrequenciesStooq = FrequenciesStooq.DAILY,
  sessions: number = 2
): string {
  const endDate = new Date();
  let startDate = new Date(endDate);

  // Determining the start date based on the unit type using the FrequenciesStooq enum
  switch (interval) {
    case FrequenciesStooq.DAILY: {
      // 'd' (days) - Now accounts for weekends
      let businessDaysToSubtract = sessions;
      while (businessDaysToSubtract > 0) {
        startDate.setDate(startDate.getDate() - 1); // Subtract one calendar day
        const dayOfWeek = startDate.getDay();
        // Check if the current day is not Saturday (6) or Sunday (0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          businessDaysToSubtract--;
        }
      }
      break;
    }
    case FrequenciesStooq.WEEKLY: // 'w' (weeks)
      startDate.setDate(startDate.getDate() - sessions * 7);
      break;
    case FrequenciesStooq.MONTHLY: // 'm' (months)
      startDate.setMonth(startDate.getMonth() - sessions);
      break;
    case FrequenciesStooq.QUARTERLY: // 'q' (quarters - 3 months)
      startDate.setMonth(startDate.getMonth() - sessions * 3);
      break;
    case FrequenciesStooq.YEARLY: // 'y' (years)
      startDate.setFullYear(startDate.getFullYear() - sessions);
      break;
    default:
      // Fallback for safety, though TypeScript types should prevent this
      console.warn(
        `[generateStooqUrlBase] Unknown unitType: ${interval}. Defaulting to daily calculation.`
      );
      // Assuming default daily calculation should also skip weekends
      let defaultBusinessDaysToSubtract = sessions;
      while (defaultBusinessDaysToSubtract > 0) {
        startDate.setDate(startDate.getDate() - 1);
        const dayOfWeek = startDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          defaultBusinessDaysToSubtract--;
        }
      }
      break;
  }

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  // Building the URL:
  // f=startDate, t=endDate, s=ticker, c=sessions (default 2), i=interval (if not 'd')
  let url = `${STOOQ_BASE_URL}?f=${formattedStartDate}&t=${formattedEndDate}&s=${ticker}`;

  // if (interval !== FrequenciesStooq.DAILY) {
  // 'd' is the default interval and is usually omitted for cleanliness
  url += `&i=${interval}`;
  // }

  return url;
}
