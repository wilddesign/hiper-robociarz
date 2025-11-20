"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [tickers, setTickers] = useState([]);
  const [trigger, setTrigger] = useState(false);
  const [add, setAdd] = useState("");
  const [remove, setRemove] = useState("");
  const [token, setToken] = useState("");

  async function getData() {
    const res = await fetch("/api/tickers", {
      headers: {
        token: token,
      },
    });
    // The return value is *not* serialized
    // You can return Date, Map, Set, etc.

    if (!res.ok) {
      // This will activate the closest `error.js` Error Boundary
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

  async function removeTicker(ticker: string) {
    const res = await fetch("/api/tickers", {
      headers: {
        token: token,
      },
      method: "DELETE",
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
  }, [trigger]);

  const handleSubmitList = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setAdd("");
    setTrigger(!trigger);
  };
  const handleSubmitAdd = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    addTicker(add);
    setAdd("");
    setTrigger(!trigger);
  };
  const handleSubmitRemove = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    removeTicker(remove);
    setRemove("");
    setTrigger(!trigger);
  };

  return (
    <>
      <h1>Stock portfolio monitoring panel</h1>

      <>
        <form onSubmit={handleSubmitList}>
          See tickers:
          <input type="submit" disabled={!token} value="Refresh" />
        </form>
      </>
      <>List tickers: </>
      {tickers.map((ticker) => (
        <p key={ticker}>{ticker}</p>
      ))}
      <>
        <form onSubmit={handleSubmitAdd}>
          <label>
            Add ticker:
            <input
              type="text"
              value={add}
              onChange={(e) => setAdd(e.target.value)}
            />
          </label>
          <input type="submit" disabled={!token || !add} value="Add" />
        </form>
      </>
      <>
        <form onSubmit={handleSubmitRemove}>
          <label>
            Remove ticker:
            <input
              type="text"
              value={remove}
              onChange={(e) => setRemove(e.target.value)}
            />
          </label>
          <input type="submit" disabled={!token || !remove} value="Remove" />
        </form>
      </>

      <>
        <form>
          <label>
            Provide token to perform any operation:
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
        </form>
      </>
    </>
  );
}
