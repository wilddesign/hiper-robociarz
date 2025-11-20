import { NextRequest, NextResponse } from "next/server";
const fs = require("fs");
// const cron = require("node-cron");
const mail = require("nodemailer");
const csvParser = require("csv-parser");
const axios = require("axios");
const { resolve } = require("path");

const TOKEN = process.env.APP_TOKEN;
const USER_EMAIL = process.env.USER_EMAIL;

const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

let tickers = [] as string[];
const cronJobsList = {} as Record<
  string,
  { start: () => {}; stop: () => {} }[]
>;

const deleteDirFilesUsingPattern = (pattern: RegExp, dirPath = __dirname) => {
  // default directory is the current directory

  // get all file names in directory
  fs.readdir(
    resolve(dirPath + "/../../../../.."),
    (err: unknown, fileNames: string[]) => {
      if (err) throw err;

      // iterate through the found file names
      for (const name of fileNames) {
        // if file name matches the pattern
        if (pattern.test(name)) {
          // try to remove the file and log the result
          fs.unlink(resolve(name), (err: unknown) => {
            if (err) throw err;
          });
        }
      }
    }
  );
};

function isLastDay(dt: Date) {
  return new Date(dt.getTime() + 86400000).getDate() === 1;
}

async function getAndParseCsvAsJson(url: string): Promise<{ close: number }[]> {
  const response = await axios.get(url, { responseType: "blob" });
  const file = response.data;
  const intermediaryFileName = `intermediaryCsv${Date.now()}.csv`;

  fs.writeFileSync(intermediaryFileName, file, (err: unknown) => {
    if (err) {
      console.error(err);
    }
  });

  const result = new Promise((resolve, reject) => {
    const results = [] as { close: number }[];
    fs.createReadStream(intermediaryFileName)
      .pipe(csvParser())
      .on("data", (data: { close: number }) => {
        results.push(data);
      })
      .on("end", () => {
        resolve(results);
      });
  }) as Promise<{ close: number }[]>;

  return await result;
}

function sendMail(text: string, title: string) {
  const transporter = mail.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    service: "gmail",
    secure: true,
    auth: {
      user: SENDER_EMAIL,
      pass: SENDER_EMAIL_PASSWORD,
    },
  });

  var mailOptions = {
    from: SENDER_EMAIL,
    to: USER_EMAIL,
    subject: `World report ${title}, use token ${TOKEN} to modify`,
    text: text,
  };

  transporter.sendMail(
    mailOptions,
    function (error: unknown, info: { response: unknown }) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
}

function dumpTickers() {
  const file = fs.createWriteStream("tickersDump.txt");
  file.on("error", function (err: unknown) {
    console.log(err);
  });
  tickers.forEach(function (ticker) {
    file.write(ticker + ", ");
  });
  file.end();
}

export async function GET(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const token = requestHeaders.get("token");
  if (token === TOKEN) {
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
        status: 403,
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

function getChangeMessage(stockData: { close: number }[], ticker: string) {
  const last = stockData[0];
  const previous = stockData[1];
  const percentage =
    (100 * (last["close"] - previous["close"])) / previous["close"];
  if (Math.abs(percentage) > 3) {
    return `${ticker} changed price by ${percentage.toFixed(2)} %, `;
  } else {
    return "";
  }
}

/**
 * Oblicza, ile milisekund pozostało do najbliższej godziny docelowej (1:00 AM).
 * @param targetHour Docelowa godzina (0-23).
 * @param targetMinute Docelowa minuta (0-59).
 * @returns Liczba milisekund do następnego uruchomienia.
 */
function calculateInitialDelay(targetHour, targetMinute) {
  const now = new Date();
  const target = new Date(now);

  // Ustawia datę docelową na 1:00 AM dzisiaj
  target.setHours(targetHour, targetMinute, 0, 0);

  // Jeśli docelowa godzina już minęła dzisiaj, ustaw ją na jutro
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  // Oblicza różnicę w milisekundach
  return target.getTime() - now.getTime();
}

/**
 * Główna funkcja uruchamiająca harmonogram wysyłki e-maili.
 */
function scheduleDailyEmail() {
  const TARGET_HOUR = 1; // 1 AM
  const TARGET_MINUTE = 0; // 00 minut
  const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

  // 1. Oblicz opóźnienie do pierwszego uruchomienia (1:00 AM)
  const initialDelay = calculateInitialDelay(TARGET_HOUR, TARGET_MINUTE);

  console.log(`Aktualna godzina: ${new Date().toLocaleTimeString()}`);
  console.log(
    `Wysyłka zaplanowana na: ${new Date(
      Date.now() + initialDelay
    ).toLocaleTimeString()}`
  );
  console.log(`Początkowe opóźnienie (ms): ${initialDelay}`);

  // 2. Użyj setTimeout, aby poczekać do pierwszej wysyłki
  setTimeout(() => {
    // Pierwsza wysyłka e-mail
    sendMail(
      "HiperRobociarz na posterunku!",
      "Melduje się Hiper Robociarz - PIERWSZA WYSYŁKA."
    );

    // 3. Po pierwszej wysyłce, ustaw pętlę setInterval na pełne 24 godziny
    setInterval(() => {
      sendMail(
        "HiperRobociarz na posterunku!",
        "Melduje się Hiper Robociarz - KOLEJNA WYSYŁKA."
      );
    }, MILLISECONDS_IN_DAY);
  }, initialDelay);
}

// Uruchomienie harmonogramu
scheduleDailyEmail();

export async function POST(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const token = requestHeaders.get("token");

  if (token === TOKEN) {
    const data = (await streamToString(req.body)).replace("ticker=", "");
    if (data) {
      tickers.push(data);
      dumpTickers();
      //set up cronjobs and add ticker to the list
      setInterval(async () => {
        const stockData = await getAndParseCsvAsJson(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${data}&apikey=${ALPHA_VANTAGE_API_KEY}&datatype=csv`
        );
        let DAY_MESSAGE = getChangeMessage(stockData, data);
        if (DAY_MESSAGE) {
          sendMail(DAY_MESSAGE, "DAY");
        }
        DAY_MESSAGE = "";
        let today = new Date().getDay();
        if (today == 6) {
          const stockData = await getAndParseCsvAsJson(
            `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${data}&apikey=${ALPHA_VANTAGE_API_KEY}&datatype=csv`
          );
          let WEEK_MESSAGE = getChangeMessage(stockData, data);
          if (WEEK_MESSAGE) {
            sendMail(WEEK_MESSAGE, "WEEK");
          }
          WEEK_MESSAGE = "";
        }

        let now = new Date();
        if (isLastDay(now)) {
          const stockData = await getAndParseCsvAsJson(
            `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${data}&apikey=${ALPHA_VANTAGE_API_KEY}&datatype=csv`
          );
          let MONTH_MESSAGE = getChangeMessage(stockData, data);
          if (MONTH_MESSAGE) {
            sendMail(MONTH_MESSAGE, "MONTH");
          }
          MONTH_MESSAGE = "";
          deleteDirFilesUsingPattern(/^intermediaryCsv+/);
        }
      }, 24 * 60 * 60000);
      cronJobsList[data] = [];
      cronJobsList[data].forEach((job: { start: () => {} }) => job.start());
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

export async function DELETE(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const token = requestHeaders.get("token");

  if (token === TOKEN) {
    const data = (await streamToString(req.body)).replace("ticker=", "");
    dumpTickers();
    if (data) {
      tickers = tickers.filter((ticker) => ticker !== data);
      dumpTickers();
      cronJobsList[data].forEach((job) => job.stop());
      delete cronJobsList[data];
    }

    return NextResponse.json({
      status: 200,
    });
  } else {
    return NextResponse.json({
      status: 403,
    });
  }
}
