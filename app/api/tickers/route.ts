import { RequestScheduler } from "@/app/_classes/RequestScheduler";
import { TickerDumper } from "@/app/_classes/TickerDumper";
import { TickerRecordData } from "@/app/_classes/TickerRecord";
import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.APP_TOKEN;
// --- STARTUP LOGIC ---
try {
  // Read the raw string content from the file synchronously.
  // Using 'utf8' encoding ensures we get a string.
  const inputString = TickerDumper.loadStringFromInputFile();

  // Check if data was successfully loaded and is not empty
  if (inputString && inputString.length > 0) {
    RequestScheduler.clearAllSchedules();

    // The data loaded is the raw string content which TickerRecordData is expected to parse.
    const parsedArray = new TickerRecordData(inputString);
    RequestScheduler.addScheduleAtTime(23, 0, parsedArray.data);

    console.log(
      "✅ Successfully loaded and scheduled tickers from inputstring.txt on startup."
    );
  } else {
    // Log if the file was found but was empty
    console.log(
      "ℹ️ inputstring.txt found, but it was empty. Continuing without initial schedule."
    );
  }
} catch (error) {
  // If the file is not found (ENOENT) or other FS error, catch the error and do nothing.
  console.log(
    "ℹ️ inputstring.txt not found or failed to load on startup. Continuing without initial schedule."
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

  if (
    token === TOKEN &&
    (RequestScheduler.schedules.length || RequestScheduler.timeOuts.length)
  ) {
    const tickers = TickerDumper.loadStringFromInputFile();
    const parsedArray = new TickerRecordData(tickers);
    return NextResponse.json(
      { data: parsedArray.data },
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

export async function POST(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const token = requestHeaders.get("token");
  const data = (await streamToString(req.body)).replace("ticker=", "");

  if (token === TOKEN) {
    try {
      TickerDumper.saveStringToFile("inputstring.txt", data);
      RequestScheduler.clearAllSchedules();
      const parsedArray = new TickerRecordData(data);
      RequestScheduler.addScheduleAtTime(23, 0, parsedArray.data);
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
