import { NextRequest, NextResponse } from 'next/server';

interface BinanceTicker {
  symbol: string;
  price: string;
}

interface Binance24hrTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: string;
  quoteVolume24h: string;
  high24h: number;
  low24h: number;
}

// Common cryptocurrency mappings
const cryptoMappings: Record<string, string> = {
  'BTCUSDT': 'Bitcoin',
  'ETHUSDT': 'Ethereum',
  'BNBUSDT': 'Binance Coin',
  'SOLUSDT': 'Solana',
  'ADAUSDT': 'Cardano',
  'DOTUSDT': 'Polkadot',
  'MATICUSDT': 'Polygon',
  'LINKUSDT': 'Chainlink',
  'UNIUSDT': 'Uniswap',
  'LTCUSDT': 'Litecoin',
  'AVAXUSDT': 'Avalanche',
  'ATOMUSDT': 'Cosmos',
  'XRPUSDT': 'Ripple',
  'DOGEUSDT': 'Dogecoin',
  'SHIBUSDT': 'Shiba Inu',
  'TRXUSDT': 'Tron',
  'FILUSDT': 'Filecoin',
  'ETCUSDT': 'Ethereum Classic',
  'VETUSDT': 'VeChain',
  'THETAUSDT': 'Theta',
  'ICPUSDT': 'Internet Computer',
  'XLMUSDT': 'Stellar',
  'SANDUSDT': 'The Sandbox',
  'MANAUSDT': 'Decentraland',
  'AXSUSDT': 'Axie Infinity',
  'AAVEUSDT': 'Aave',
  'MKRUSDT': 'Maker',
  'COMPUSDT': 'Compound',
  'SUSHIUSDT': 'SushiSwap',
  'CRVUSDT': 'Curve DAO Token',
  'YFIUSDT': 'yearn.finance',
  'ENJUSDT': 'Enjin Coin',
  'CHZUSDT': 'Chiliz',
  'FTMUSDT': 'Fantom',
  'NEARUSDT': 'Near Protocol',
  'ALGOUSDT': 'Algorand',
  'CELOUSDT': 'Celo',
  'ONEUSDT': 'Harmony',
  'HOTUSDT': 'Holo',
  'CROUSDT': 'Cronos',
  'LUNAUSDT': 'Terra',
  'ICXUSDT': 'ICON',
  'KSMUSDT': 'Kusama',
  'ZRXUSDT': '0x',
  'BATUSDT': 'Basic Attention Token',
  'KNCUSDT': 'Kyber Network',
  'ZILUSDT': 'Zilliqa',
  'RLCUSDT': 'iExec RLC',
  'STXUSDT': 'Stacks',
  'WAVESUSDT': 'Waves',
  'KAVAUSDT': 'Kava',
  'ARUSDT': 'Arweave',
  'RUNEUSDT': 'THORChain',
  'ROSEUSDT': 'Oasis Network',
  'ALPHAUSDT': 'Alpha Finance Lab',
  'BANDUSDT': 'Band Protocol',
  'RSRUSDT': 'Reserve Rights',
  'BALUSDT': 'Balancer',
  'SRMUSDT': 'Serum',
  'SXPUSDT': 'Swipe',
  'RENUSDT': 'Ren',
  'DENTUSDT': 'Dent',
  'WRXUSDT': 'WazirX',
  'INJUSDT': 'Injective',
  'GMTUSDT': 'StepN',
  'APTUSDT': 'Aptos',
  'ARBUSDT': 'Arbitrum',
  'OPUSDT': 'Optimism',
  'LDOUSDT': 'Lido DAO',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch both price and 24hr ticker data
    const [priceResponse, ticker24hResponse] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price'),
      fetch('https://api.binance.com/api/v3/ticker/24hr')
    ]);

    if (!priceResponse.ok || !ticker24hResponse.ok) {
      throw new Error('Failed to fetch data from Binance API');
    }

    const priceData: BinanceTicker[] = await priceResponse.json();
    const ticker24hData: Binance24hrTicker[] = await ticker24hResponse.json();

    // Create a map for quick lookup of 24hr data
    const tickerMap = new Map<string, Binance24hrTicker>();
    ticker24hData.forEach(ticker => {
      tickerMap.set(ticker.symbol, ticker);
    });

    // Process the data
    let processedData: CryptoData[] = priceData
      .filter(ticker => {
        // Only include USDT pairs and known cryptocurrencies
        return ticker.symbol.endsWith('USDT') && 
               cryptoMappings[ticker.symbol];
      })
      .map(ticker => {
        const symbol = ticker.symbol.replace('USDT', '');
        const price = parseFloat(ticker.price);
        const ticker24h = tickerMap.get(ticker.symbol);
        
        return {
          symbol,
          name: cryptoMappings[ticker.symbol] || symbol,
          price,
          change24h: ticker24h ? parseFloat(ticker24h.priceChange) : 0,
          changePercent24h: ticker24h ? parseFloat(ticker24h.priceChangePercent) : 0,
          volume24h: ticker24h ? ticker24h.volume : '0',
          quoteVolume24h: ticker24h ? ticker24h.quoteVolume : '0',
          high24h: ticker24h ? parseFloat(ticker24h.highPrice) : price,
          low24h: ticker24h ? parseFloat(ticker24h.lowPrice) : price,
        };
      })
      .sort((a, b) => {
        // Sort by market cap (volume * price) for a better ranking
        const aMarketCap = parseFloat(a.quoteVolume24h);
        const bMarketCap = parseFloat(b.quoteVolume24h);
        return bMarketCap - aMarketCap;
      });

    // Apply search filter if provided
    if (search) {
      processedData = processedData.filter(crypto => 
        crypto.symbol.toLowerCase().includes(search) ||
        crypto.name.toLowerCase().includes(search)
      );
    }

    // Apply limit
    processedData = processedData.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: processedData,
      total: processedData.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cryptocurrency data' 
      },
      { status: 500 }
    );
  }
}
