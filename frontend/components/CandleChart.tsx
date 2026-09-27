"use client";

type Candle={open_time:number;open:number;high:number;low:number;close:number;volume:number};
type Levels={support:number;resistance:number;breakout_confirmation:number;entry_zone:[number,number];invalidation:number;tp1:number;tp2:number;tp3:number};

function fmt(v:number){return v>=1000?v.toLocaleString(undefined,{maximumFractionDigits:0}):v.toLocaleString(undefined,{maximumFractionDigits:4})}

export default function CandleChart({candles,levels}:{candles:Candle[];levels?:Levels}){
  if(!candles.length)return <div className="muted">Waiting for candles…</div>;
  const width=1000,height=430,p={top:20,right:100,bottom:28,left:16},visible=candles.slice(-64);
  const annotated=levels?[levels.support,levels.resistance,levels.breakout_confirmation,levels.invalidation,levels.tp1,levels.tp2,levels.tp3]:[];
  let min=Math.min(...visible.map(c=>c.low),...annotated),max=Math.max(...visible.map(c=>c.high),...annotated);
  const span=Math.max(max-min,1);min-=span*.06;max+=span*.06;
  const pw=width-p.left-p.right,ph=height-p.top-p.bottom;
  const x=(i:number)=>p.left+(i+.5)*(pw/visible.length),y=(price:number)=>p.top+((max-price)/(max-min))*ph,bw=Math.max(3,(pw/visible.length)*.58);
  const guides=levels?[
    {k:"TP3",v:levels.tp3,t:"target"},{k:"TP2",v:levels.tp2,t:"target"},{k:"TP1",v:levels.tp1,t:"target"},
    {k:"Confirm",v:levels.breakout_confirmation,t:"watch"},{k:"Resistance",v:levels.resistance,t:"watch"},
    {k:"Invalidation",v:levels.invalidation,t:"danger"},{k:"Support",v:levels.support,t:"muted"}
  ]:[];
  const stroke=(t:string)=>t==="target"?"#39d98a":t==="danger"?"#ff6b7a":t==="watch"?"#f2c94c":"#65758b";
  return <svg className="chart" viewBox={"0 0 "+width+" "+height} role="img" aria-label="Candlestick chart with breakout levels">
    <rect width={width} height={height} fill="#0b111c" rx="14"/>
    {[0,1,2,3,4].map(i=>{const yy=p.top+(ph/4)*i;return <line key={i} x1={p.left} x2={width-p.right} y1={yy} y2={yy} stroke="#1d2a3d"/>})}
    {levels&&<rect x={p.left} y={y(levels.entry_zone[1])} width={pw} height={Math.max(3,y(levels.entry_zone[0])-y(levels.entry_zone[1]))} fill="rgba(117,167,255,.08)"/>}
    {guides.map(g=><g key={g.k}><line x1={p.left} x2={width-p.right} y1={y(g.v)} y2={y(g.v)} stroke={stroke(g.t)} strokeDasharray="5 5" opacity=".75"/><text x={width-p.right+8} y={y(g.v)+4} fill={stroke(g.t)} fontSize="12">{g.k+" "+fmt(g.v)}</text></g>)}
    {visible.map((c,i)=>{const up=c.close>=c.open,color=up?"#39d98a":"#ff6b7a",top=y(Math.max(c.open,c.close)),bottom=y(Math.min(c.open,c.close));return <g key={c.open_time}><line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1.2"/><rect x={x(i)-bw/2} y={top} width={bw} height={Math.max(1.5,bottom-top)} fill={color} rx="1"/></g>})}
  </svg>;
}
