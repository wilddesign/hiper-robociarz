"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [tickers, setTickers] = useState([]);
  const [trigger, setTrigger] = useState(false);
  const [add, setAdd] = useState("");
  const [token, setToken] = useState("");
  const [csvBuffer, setCsvBuffer] = useState(null);

  async function getData() {
    const res = await fetch("/api/tickers", {
      headers: {
        token: token,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    return res.json();
  }

  async function addTicker(ticker: string) {
    const res = await fetch("/api/tickers", {
      headers: {
        token: token,
      },
      method: "POST",
      body: new URLSearchParams({
        ticker: ticker,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    return res.json();
  }

  useEffect(() => {
    const updateViews = async () => {
      const list = await getData();
      setTickers(list.data);
    };

    if (token) {
      updateViews();
    }
  }, [trigger, token]);

  const handleSubmitList = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setAdd("");
    setTrigger(!trigger);
  };
  const handleSubmitAdd = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!token || !csvBuffer) {
      return;
    }

    const base64Content = arrayBufferToBase64(csvBuffer);

    console.log("Submitting Base64-encoded CSV buffer to backend...");

    await addTicker(base64Content);

    setCsvBuffer(null);
    setTrigger(!trigger);
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    setCsvBuffer(null);

    if (file) {
      const reader = new FileReader();

      reader.onload = (event) => {
        setCsvBuffer(event.target.result);
      };

      reader.readAsArrayBuffer(file);
    }
  };

  return (
    // Main container: Light gray background, minimal padding, simple text
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 sm:p-10 font-sans">
      {/* Page Header and Main Content Grid */}
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-light tracking-tight text-gray-800">
            Stock Portfolio Monitoring
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            A clean overview of your investments.
          </p>
        </header>

        {/* Main Content Grid (3 columns, 1fr for image, 2fr for forms) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {" "}
          {/* Increased gap */}
          {/* Image/Visualization Column (Simplifed) */}
          <div className="lg:col-span-1 flex justify-center items-start">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              {" "}
              {/* Minimal border, white background */}
              <img
                src={"hiperrobociarz.png"}
                alt="Visualization" // Simplified alt text
                className="rounded-md object-cover w-full h-auto max-h-80" // Slightly smaller max-height
              />
              <p className="text-center mt-3 text-sm text-gray-500">
                Hiper robociarz
              </p>
            </div>
          </div>
          {/* Forms and Tickers Column (Spans 2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-10">
            {" "}
            {/* Increased space */}
            {/* 🔑 Token Input Panel */}
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              {" "}
              {/* White background, minimal border */}
              <h3 className="text-xl font-normal mb-5 text-gray-700">
                {" "}
                {/* Lighter font weight */}
                Security Token
              </h3>
              <form>
                <label className="block text-sm font-light text-gray-600 mb-2">
                  {" "}
                  {/* Lighter text, simpler font */}
                  Provide token to perform any operation:
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your security token"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400" // Subtle focus
                />
              </form>
            </div>
            {/* 📈 Ticker List and Retrieval */}
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              {" "}
              {/* White background, minimal border */}
              <h2 className="text-2xl font-normal mb-5 text-gray-700">
                {" "}
                {/* Lighter font weight */}
                Managed Tickers
              </h2>
              {/* Tickers Display */}
              <div className="p-4 bg-gray-50 rounded-md min-h-[100px] mb-5 border border-gray-200">
                {" "}
                {/* Light background, subtle border */}
                <h3 className="text-lg font-light text-gray-600 mb-3">
                  {" "}
                  {/* Lighter font weight and color */}
                  List of Tracked Tickers:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tickers.length ? (
                    tickers.map((ticker) => (
                      <span
                        key={ticker.ticker}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200 hover:bg-gray-200 transition duration-150" // Neutral badges
                      >
                        {ticker.ticker}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">
                      No tickers currently tracked.
                    </p>
                  )}
                </div>
              </div>
              {/* See Tickers Button */}
              <form onSubmit={handleSubmitList} className="mt-4">
                <button
                  type="submit"
                  disabled={!token}
                  className={`w-full text-base font-normal py-3 px-4 rounded-md transition duration-150 ${
                    // Larger padding, normal font
                    token
                      ? "bg-blue-500 text-white hover:bg-blue-600" // Subtle blue accent
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Refresh/See Tickers
                </button>
              </form>
            </div>
            {/* 📁 Add Tickers Form */}
            <div className="p-6 bg-white rounded-lg border border-gray-200">
              {" "}
              {/* White background, minimal border */}
              <h2 className="text-2xl font-normal mb-5 text-gray-700">
                {" "}
                {/* Lighter font weight */}
                Add New Tickers
              </h2>
              <form onSubmit={handleSubmitAdd} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-light text-gray-600 mb-2 block">
                    {" "}
                    {/* Lighter text, simpler font */}
                    Upload CSV with Tickers:
                  </span>
                  <input
                    type="file"
                    accept=".csv, text/csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border file:border-gray-300
                file:text-sm file:font-normal
                file:bg-gray-50 file:text-gray-700
                hover:file:bg-gray-100 cursor-pointer
              " // Neutral file input styling
                  />
                </label>
                <button
                  type="submit"
                  disabled={!token || !csvBuffer}
                  className={`w-full text-base font-normal py-3 px-4 rounded-md transition duration-150 ${
                    // Larger padding, normal font
                    token && csvBuffer
                      ? "bg-blue-500 text-white hover:bg-blue-600" // Subtle blue accent
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Upload & Add Tickers
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
