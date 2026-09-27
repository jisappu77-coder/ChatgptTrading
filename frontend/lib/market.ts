export const SYMBOLS = ["BTCUSDT","ETHUSDT","BNBUSDT","XRPUSDT","SOLUSDT"] as const;
const BASE = "https://data-api.binance.vision";

export type Market = {
  symbol:string;
  price:number;
  change_24h_pct:number;
  volume_quote_24h:number;
  high_24h:number;
  low_24h:number;
};

export type Candle = {
  open_time:number;
  open:number;
  high:number;
  low:number;
  close:number;
  volume:number;
  close_time:number;
};

export type Analysis = {
  symbol:string;
  interval:string;
  price:number;
  structure:string;
  state:"CONFIRMED"|"BREAKOUT_WATCH"|"NO_SETUP";
  indicators:{
    ema20:number;
    ema50:number;
    ema200:number|null;
    rsi14:number;
    atr14:number;
    volume_vs_20_avg:number;
  };
  levels:{
    support:number;
    resistance:number;
    breakout_confirmation:number;
    entry_zone:[number,number];
    invalidation:number;
    tp1:number;
    tp2:number;
    tp3:number;
  };
};

async function getJson<T>(path:string):Promise<T>{
  const response=await fetch(BASE+path,{cache:"no-store"});
  if(!response.ok) throw new Error("Market-data request failed ("+response.status+").");
  return response.json() as Promise<T>;
}

export async function getMarkets():Promise<Market[]>{
  return Promise.all(SYMBOLS.map(async symbol=>{
    const data=await getJson<Record<string,string>>("/api/v3/ticker/24hr?symbol="+symbol);
    return {
      symbol,
      price:Number(data.lastPrice),
      change_24h_pct:Number(data.priceChangePercent),
      volume_quote_24h:Number(data.quoteVolume),
      high_24h:Number(data.highPrice),
      low_24h:Number(data.lowPrice),
    };
  }));
}

export async function getCandles(symbol:string, interval="15m", limit=250):Promise<Candle[]>{
  const raw=await getJson<Array<Array<string|number>>>(
    "/api/v3/klines?symbol="+symbol+"&interval="+interval+"&limit="+limit
  );
  return raw.map(row=>({
    open_time:Number(row[0]),
    open:Number(row[1]),
    high:Number(row[2]),
    low:Number(row[3]),
    close:Number(row[4]),
    volume:Number(row[5]),
    close_time:Number(row[6]),
  }));
}

function ema(values:number[],period:number){
  const alpha=2/(period+1);
  let value=values[0];
  for(let i=1;i<values.length;i++) value=alpha*values[i]+(1-alpha)*value;
  return value;
}

function rsi(values:number[],period=14){
  if(values.length<=period) return 50;
  let gain=0,loss=0;
  for(let i=1;i<=period;i++){
    const d=values[i]-values[i-1];
    if(d>=0) gain+=d; else loss-=d;
  }
  gain/=period; loss/=period;
  for(let i=period+1;i<values.length;i++){
    const d=values[i]-values[i-1];
    const g=Math.max(d,0),l=Math.max(-d,0);
    gain=((gain*(period-1))+g)/period;
    loss=((loss*(period-1))+l)/period;
  }
  if(loss===0) return 100;
  const rs=gain/loss;
  return 100-(100/(1+rs));
}

function atr(candles:Candle[],period=14){
  const tr:number[]=[];
  for(let i=0;i<candles.length;i++){
    const c=candles[i];
    if(i===0) tr.push(c.high-c.low);
    else{
      const prev=candles[i-1].close;
      tr.push(Math.max(c.high-c.low,Math.abs(c.high-prev),Math.abs(c.low-prev)));
    }
  }
  return ema(tr,period);
}

export function analyze(symbol:string,interval:string,candles:Candle[]):Analysis{
  if(candles.length<60) throw new Error("Not enough candles for analysis.");
  const closes=candles.map(c=>c.close);
  const latest=candles[candles.length-1];
  const prior=candles.slice(0,-1);
  const lookback=prior.slice(-20);
  const resistance=Math.max(...lookback.map(c=>c.high));
  const support=Math.min(...lookback.map(c=>c.low));
  const avgVolume=lookback.reduce((sum,c)=>sum+c.volume,0)/lookback.length;
  const volumeRatio=avgVolume?latest.volume/avgVolume:0;
  const ema20=ema(closes,20),ema50=ema(closes,50);
  const ema200=closes.length>=200?ema(closes,200):null;
  const atr14=atr(candles,14),rsi14=rsi(closes,14);
  const price=latest.close;
  const structure=price>ema20&&ema20>ema50?"bullish":price<ema20&&ema20<ema50?"bearish":"range_or_transition";
  const breakoutBuffer=Math.max(atr14*0.08,resistance*0.0005);
  const state:Analysis["state"]=
    price>resistance+breakoutBuffer&&volumeRatio>=1.15
      ?"CONFIRMED"
      :price>=resistance-breakoutBuffer
        ?"BREAKOUT_WATCH"
        :"NO_SETUP";
  return {
    symbol,interval,price,structure,state,
    indicators:{ema20,ema50,ema200,rsi14,atr14,volume_vs_20_avg:volumeRatio},
    levels:{
      support,
      resistance,
      breakout_confirmation:resistance+breakoutBuffer,
      entry_zone:[resistance,resistance+atr14*0.20],
      invalidation:resistance-atr14*1.05,
      tp1:resistance+atr14,
      tp2:resistance+atr14*2,
      tp3:resistance+atr14*3,
    },
  };
}
