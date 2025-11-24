import { Monitor } from "@/app/_classes/Monitor";
import { TickerDumper } from "@/app/_classes/TickerDumper";
import { TickerRecordData } from "@/app/_classes/TickerRecord";
import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.APP_TOKEN;
// --- STARTUP LOGIC ---
try {
  // Read the raw string content from the file synchronously.
  // Using 'utf8' encoding ensures we get a string.
  const inputString = TickerDumper.loadStringFromInputFile("inputstring.txt");
  const polishInputString = TickerDumper.loadStringFromInputFile(
    "polishinputstring.txt"
  );

  // Check if data was successfully loaded and is not empty
  if (inputString && inputString.length > 0) {
    Monitor.globalMonitor(inputString);
    console.log(
      "✅ Successfully loaded and scheduled tickers from inputstring.txt on startup."
    );
  } else {
    // Log if the file was found but was empty
    console.log(
      "ℹ️ inputstring.txt found, but it was empty. Continuing without initial schedule."
    );
  }
  // Check if data was successfully loaded and is not empty
  if (polishInputString && polishInputString.length > 0) {
    Monitor.polishMonitor(polishInputString);
    console.log(
      "✅ Successfully loaded and scheduled tickers from polishInputString.txt on startup."
    );
  } else {
    // Log if the file was found but was empty
    console.log(
      "ℹ️ polishInputString.txt found, but it was empty. Continuing without initial schedule."
    );
  }
} catch (error) {
  // If the file is not found (ENOENT) or other FS error, catch the error and do nothing.
  console.log(
    "ℹ️ inputstring.txt or polishInputString failed to load on startup. Continuing without initial schedule."
  );
  if (error instanceof Error) {
    // Log the specific error for debugging if needed
    // console.error("\nStartup Load Error:", error.message);
  }
}
// --- END STARTUP LOGIC ---

export async function GET(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const token = requestHeaders.get("token");

  if (token === TOKEN) {
    return NextResponse.json(
      {
        data: ["inputstring.txt", "polishinputstring.txt"].map(
          (inputString) => {
            return new TickerRecordData(
              TickerDumper.loadStringFromInputFile(inputString)
            ).data;
          }
        ),
      },
      {
        status: 200,
      }
    );
  } else {
    return NextResponse.json(
      { data: [] },
      {
        status: 200,
      }
    );
  }
}

async function streamToString(stream: any) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Processes the request body stream to extract global and Polish ticker lists.
 * Assumes the body content is a single string where:
 * - Global tickers are prefixed by "ticker="
 * - Polish tickers are prefixed by "polishTicker="
 * @param {object} req - The request object containing the body stream.
 * @returns {object} An object containing the global and Polish ticker strings.
 */
const processTickerData = async (req) => {
  // 1. Convert the request body stream to a single string
  const bodyString = await streamToString(req.body);

  // 2. Use URLSearchParams or simple parsing to extract fields.
  // We'll use a robust approach assuming URL-encoded format (key1=val1&key2=val2).
  const params = new URLSearchParams(bodyString);

  // 3. Extract the values for 'ticker' and 'tickerPolish'.
  // .get() returns null if the key isn't found, which is safe.
  const tickerData = params.get("ticker");
  const polishTickerData = params.get("tickerPolish");

  // 4. Return the data in the required object format
  return {
    ticker: tickerData ? tickerData.trim() : null,
    tickerPolish: polishTickerData ? polishTickerData.trim() : null,
  };
};

export async function POST(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const token = requestHeaders.get("token");
  const data = await processTickerData(req);

  if (token === TOKEN) {
    try {
      if (data.ticker) Monitor.globalMonitor(data.ticker);
      if (data.tickerPolish) Monitor.polishMonitor(data.tickerPolish);
    } catch (error) {
      if (error instanceof Error) {
        console.error("\nParsing Error:", error.message);
      } else {
        console.error("\nAn unknown error occurred during parsing.");
      }
    }

    return NextResponse.json(
      { data: [] },
      {
        status: 200,
      }
    );
  } else {
    return NextResponse.json(
      { data: [] },
      {
        status: 403,
      }
    );
  }
}
