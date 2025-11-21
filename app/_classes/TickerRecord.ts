import { parse, ParseConfig, ParseResult } from "papaparse";
import { TickerDumper } from "./TickerDumper";
/**
 * Interface defining the structure of the data records after parsing.
 * Since PapaParse's result uses dynamic keys, we must allow string index signatures.
 */
export interface ITickerRecord {
  ticker: string;
  comment: string;
  // This allows for any additional keys found in the CSV headers
  [key: string]: string;
}

export class TickerRecordData {
  data: ITickerRecord[] = [];
  constructor(base64String: string) {
    this.data = parseBase64CsvWithPapaParse(base64String);
    TickerDumper.saveArrayToFileSync("dumptickers.txt", this.data);
  }
}

/**
 * Parses a Base64-encoded string representing a CSV file into an array of objects
 * using the PapaParse library.
 *
 * This function decodes the Base64 content back to a raw string and then uses
 * PapaParse to convert the CSV structure into an array of objects.
 *
 * @param base64String The input string, which is the raw content of the CSV file encoded in Base64.
 * @returns An array of TickerRecord objects.
 */
function parseBase64CsvWithPapaParse(base64String: string): ITickerRecord[] {
  if (!base64String) {
    return [];
  }

  // --- Step 1: Decode Base64 to a raw binary string ---
  let rawBinaryString: string;
  try {
    // In a Node.js environment, the standard method for Base64 decoding is:
    // rawBinaryString = Buffer.from(base64String, 'base64').toString('binary');

    // Using the browser's global 'atob' for execution context compatibility:
    rawBinaryString = atob(base64String);
  } catch (error) {
    console.error("Failed to decode Base64 string:", error);
    throw new Error("Invalid Base64 input.");
  }

  // --- Step 2: Convert raw binary string to text (handling UTF-8) ---
  // Converts the Latin-1 string produced by atob back into a proper UTF-8 string.
  let csvText: string = decodeURIComponent(
    Array.prototype.map
      .call(rawBinaryString, (c: string) => {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  // --- Step 3: Use PapaParse to parse the CSV string ---
  return parseCsvToObject<ITickerRecord>(csvText);
}

export function parseCsvToObject<T>(csvText: string): T[] {
  const config: ParseConfig = {
    header: true, // Treat the first row as headers
    skipEmptyLines: true, // Ignore empty lines in the file
    dynamicTyping: false, // Keep all data as strings (standard for initial CSV read)
    trimHeaders: true, // Trim whitespace from headers
    transformHeader: (header: string) => header.toLowerCase().trim(), // Normalize headers
  };

  const parseResult: ParseResult<T> = parse<T>(csvText, config);

  // You can optionally inspect errors here:
  if (parseResult.errors.length > 0) {
    console.warn(
      "PapaParse detected errors during parsing:",
      parseResult.errors
    );
  }

  // The 'data' array contains the parsed objects
  return parseResult.data;
}
