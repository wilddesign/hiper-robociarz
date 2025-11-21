import { RequestScheduler } from "@/app/_classes/RequestScheduler";
import { TickerDumper } from "@/app/_classes/TickerDumper";
import { TickerRecordData } from "@/app/_classes/TickerRecord";
import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.APP_TOKEN;

export async function GET(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const token = requestHeaders.get("token");

  if (
    token === TOKEN &&
    (RequestScheduler.schedules.length || RequestScheduler.timeOuts.length)
  ) {
    const tickers = TickerDumper.loadArrayFromFileSync("dumptickers.txt");
    return NextResponse.json(
      { data: tickers },
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
