"use client";

import {useCallback,useEffect,useState} from "react";
import CandleChart from "@/components/CandleChart";
import {Analysis,Candle,Market,analyze,getCandles,getMarkets} from "@/lib/market";

function money(v:number){const d=v>=1000?0:4;return "$"+v.toLocaleString(undefined,{maximumFractionDigits:d})}
function compact(v:number){return Intl.NumberFormat(undefined,{notation:"compact",maximumFractionDigits:2}).format(v)}

export default function Home(){
 const[markets,setMarkets]=useState<Market[]>([]),[selected,setSelected]=useState("BTCUSDT"),[analysis,setAnalysis]=useState<Analysis|null>(null),[candles,setCandles]=useState<Candle[]>([]),[error,setError]=useState<string|null>(null),[updated,setUpdated]=useState<Date|null>(null);

 const refresh=useCallback(async()=>{
  try{
   setError(null);
   const [marketRows,series]=await Promise.all([getMarkets(),getCandles(selected,"15m",250)]);
   setMarkets(marketRows);
   setCandles(series);
   setAnalysis(analyze(selected,"15m",series));
   setUpdated(new Date());
  }catch(e){
   setError(e instanceof Error?e.message:"Unable to refresh market data.");
  }
 },[selected]);

 useEffect(()=>{
   refresh();
   const timer=window.setInterval(refresh,15000);
   return()=>window.clearInterval(timer);
 },[refresh]);

 const badge=analysis?.state==="CONFIRMED"?"confirmed":analysis?.state==="BREAKOUT_WATCH"?"watch":"none";

 return <main>
  <header className="header">
   <div>
    <div className="eyebrow">Intraday market intelligence</div>
    <h1>ChatgptTrading</h1>
    <div className="subtitle">Top-5 scanner · 15m breakout structure · scenario-based risk levels</div>
   </div>
   <div className="muted">{updated?"Updated "+updated.toLocaleTimeString():"Connecting…"}</div>
  </header>

  {error&&<div className="notice error">{error}</div>}

  <div className="panel" style={{marginBottom:20}}>
   <div className="panelHeader">
    <strong>Top 5 scanner</strong>
    <span className="muted">Public Binance market data · browser-side analysis</span>
   </div>
   <div style={{overflowX:"auto"}}>
    <table className="marketTable">
     <thead><tr><th>Market</th><th>Price</th><th>24h</th><th>24h quote volume</th><th>Range</th></tr></thead>
     <tbody>{markets.map(m=><tr key={m.symbol}>
      <td><button className="marketButton" onClick={()=>setSelected(m.symbol)}>{m.symbol.replace("USDT","/USDT")}</button></td>
      <td>{money(m.price)}</td>
      <td className={m.change_24h_pct>=0?"positive":"negative"}>{(m.change_24h_pct>=0?"+":"")+m.change_24h_pct.toFixed(2)+"%"}</td>
      <td>{"$"+compact(m.volume_quote_24h)}</td>
      <td>{money(m.low_24h)+" – "+money(m.high_24h)}</td>
     </tr>)}</tbody>
    </table>
   </div>
  </div>

  <section className="grid">
   <div className="panel">
    <div className="panelHeader">
     <div><strong>{selected.replace("USDT","/USDT")+" · 15m"}</strong><div className="muted">Candles with scenario levels</div></div>
     <span className={"badge "+badge}>{analysis?.state??"LOADING"}</span>
    </div>
    <div className="chartWrap"><CandleChart candles={candles} levels={analysis?.levels}/></div>
   </div>

   <aside className="panel">
    <div className="panelHeader"><strong>Breakout plan</strong><span className="muted">{analysis?.structure??"—"}</span></div>
    <div className="panelBody">
     <div className="metrics">
      <div className="metric"><div className="metricLabel">EMA 20</div><div className="metricValue">{analysis?money(analysis.indicators.ema20):"—"}</div></div>
      <div className="metric"><div className="metricLabel">EMA 50</div><div className="metricValue">{analysis?money(analysis.indicators.ema50):"—"}</div></div>
      <div className="metric"><div className="metricLabel">RSI 14</div><div className="metricValue">{analysis?analysis.indicators.rsi14.toFixed(1):"—"}</div></div>
      <div className="metric"><div className="metricLabel">Volume / avg</div><div className="metricValue">{analysis?analysis.indicators.volume_vs_20_avg.toFixed(2)+"x":"—"}</div></div>
     </div>
     <div className="levelList">{analysis&&<>
      <div className="levelRow"><span className="muted">Support</span><strong>{money(analysis.levels.support)}</strong></div>
      <div className="levelRow"><span className="muted">Resistance</span><strong>{money(analysis.levels.resistance)}</strong></div>
      <div className="levelRow"><span className="muted">Breakout confirm</span><strong>{money(analysis.levels.breakout_confirmation)}</strong></div>
      <div className="levelRow"><span className="muted">Entry zone</span><strong>{money(analysis.levels.entry_zone[0])+" – "+money(analysis.levels.entry_zone[1])}</strong></div>
      <div className="levelRow"><span className="muted">Invalidation</span><strong className="negative">{money(analysis.levels.invalidation)}</strong></div>
      <div className="levelRow"><span className="muted">TP1</span><strong className="positive">{money(analysis.levels.tp1)}</strong></div>
      <div className="levelRow"><span className="muted">TP2</span><strong className="positive">{money(analysis.levels.tp2)}</strong></div>
      <div className="levelRow"><span className="muted">TP3</span><strong className="positive">{money(analysis.levels.tp3)}</strong></div>
     </>}</div>
     <div className="notice">A breakout is not confirmed until the 15m candle closes above confirmation with relative-volume support. Levels are scenario outputs, not guaranteed trade signals.</div>
    </div>
   </aside>
  </section>
 </main>;
}
