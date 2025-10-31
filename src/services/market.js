// Small service wrapper to fetch market data.
// We'll use CoinGecko public API (no API key required, supports CORS).

export async function fetchTopCryptoGainers({ vs_currency = 'eur', per_page = 100, top = 5 } = {}) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${encodeURIComponent(vs_currency)}&order=market_cap_desc&per_page=${per_page}&page=1&price_change_percentage=24h`;
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`)
    const data = await res.json()

    // sort by 24h price change percentage descending
    const sorted = data
      .filter(d => typeof d.price_change_percentage_24h === 'number')
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)

    return sorted.slice(0, top).map(d => ({
      id: d.id,
      symbol: d.symbol,
      name: d.name,
      image: d.image,
      current_price: d.current_price,
      price_change_percentage_24h: d.price_change_percentage_24h,
      market_cap: d.market_cap
    }))
  } catch (err) {
    console.error('fetchTopCryptoGainers', err)
    throw err
  }
}

// Placeholder: stock-market endpoints require API keys for reliable sources.
// We can add support for Alpha Vantage / Finnhub / FinancialModelingPrep if you provide an API key.
