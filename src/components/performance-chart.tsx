type ChartTrip = {
  trip_number: string;
  trip_date: string;
  region_name: string;
  delivered_orders: number | null;
};

type Series = { name: string; color: string; values: Array<number|null>; details: string[]; total?: boolean };

const palette = ["#ffbd18", "#ed1b2e", "#38bdf8", "#a78bfa", "#34d399", "#fb7185", "#f97316", "#60a5fa"];

export function PerformanceChart({trips,startDate,endDate,driverName}:{trips:ChartTrip[];startDate:string;endDate:string;driverName?:string}) {
  const dates=dateRange(startDate,endDate);
  const regionNames=[...new Set(trips.map((trip)=>trip.region_name || "Unassigned"))].sort();
  const series:Series[]=regionNames.map((name,index)=>{
    const dailyTrips=dates.map((date)=>trips.filter((trip)=>trip.trip_date===date&&(trip.region_name||"Unassigned")===name&&Number(trip.delivered_orders??0)>0));
    return {
      name,
      color:palette[index%palette.length],
      values:dailyTrips.map((items)=>items.length?items.reduce((sum,trip)=>sum+Number(trip.delivered_orders??0),0):null),
      details:dailyTrips.map((items,dateIndex)=>pointDetails(dates[dateIndex],name,items)),
    };
  });
  if(driverName){
    const dailyTrips=dates.map((date)=>trips.filter((trip)=>trip.trip_date===date&&Number(trip.delivered_orders??0)>0));
    series.push({name:"Total orders",color:"#ffffff",total:true,values:dailyTrips.map((items)=>items.length?items.reduce((sum,trip)=>sum+Number(trip.delivered_orders??0),0):null),details:dailyTrips.map((items,dateIndex)=>pointDetails(dates[dateIndex],"All regions",items))});
  }

  const totalOrders=trips.reduce((sum,trip)=>sum+Number(trip.delivered_orders??0),0);
  const maxValue=Math.max(1,...series.flatMap((item)=>item.values.filter((value):value is number=>value!==null)));
  const yMax=niceMaximum(maxValue);
  const width=900,height=320,left=58,right=22,top=24,bottom=48;
  const plotWidth=width-left-right,plotHeight=height-top-bottom;
  const x=(index:number)=>left+(dates.length===1?plotWidth/2:(index/(dates.length-1))*plotWidth);
  const y=(value:number)=>top+plotHeight-(value/yMax)*plotHeight;
  const labelEvery=Math.max(1,Math.ceil(dates.length/7));

  return <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="eyebrow">DELIVERY PERFORMANCE</p><h2 className="mt-2 text-xl font-semibold">Orders by region</h2><p className="mt-1 text-sm text-slate-400">Daily delivered orders{driverName?` for ${driverName}`:" across all drivers"}.</p></div>
      <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-right"><p className="text-xs uppercase tracking-wider text-slate-500">Total delivered</p><strong className="mt-1 block text-2xl text-emerald-300">{totalOrders.toLocaleString()}</strong></div>
    </div>
    {series.length===0?<div className="mt-6 rounded-xl border border-dashed border-slate-700 p-12 text-center text-slate-400">No delivered orders match the selected filters.</div>:<>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">{series.map((item)=><div key={item.name} className="flex items-center gap-2 text-xs text-slate-300"><span className="h-2.5 w-2.5 rounded-full" style={{background:item.color,boxShadow:item.total?`0 0 10px ${item.color}`:undefined}}/>{item.name}</div>)}</div>
      <div className="mt-4 overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="min-w-[680px] w-full" role="img" aria-label="Daily delivered orders by region">
        {[0,.25,.5,.75,1].map((ratio)=>{const value=Math.round(yMax*(1-ratio));const py=top+plotHeight*ratio;return <g key={ratio}><line x1={left} x2={width-right} y1={py} y2={py} stroke="#343437" strokeDasharray="4 5"/><text x={left-12} y={py+4} fill="#85858b" fontSize="11" textAnchor="end">{value}</text></g>})}
        {dates.map((date,index)=>(index%labelEvery===0||index===dates.length-1)?<text key={date} x={x(index)} y={height-15} fill="#85858b" fontSize="11" textAnchor="middle">{shortDate(date)}</text>:null)}
        {series.map((item)=>{const points=item.values.flatMap((value,index)=>value===null?[]:[`${x(index)},${y(value)}`]).join(" ");return <g key={item.name}><polyline points={points} fill="none" stroke={item.color} strokeWidth={item.total?4:2.5} strokeLinecap="round" strokeLinejoin="round" opacity={item.total?1:.88}/>{item.values.flatMap((value,index)=>value===null?[]:[<circle key={`${item.name}-${dates[index]}`} cx={x(index)} cy={y(value)} r={item.total?5:4} fill="#121214" stroke={item.color} strokeWidth="2" className="cursor-help"><title>{item.details[index]}</title></circle>])}</g>})}
      </svg></div>
    </>}
  </section>;
}

function dateRange(start:string,end:string){const result:string[]=[];const current=new Date(`${start}T00:00:00Z`);const last=new Date(`${end}T00:00:00Z`);while(current<=last&&result.length<367){result.push(current.toISOString().slice(0,10));current.setUTCDate(current.getUTCDate()+1)}return result}
function niceMaximum(value:number){const magnitude=10**Math.floor(Math.log10(value));return Math.ceil(value/magnitude)*magnitude}
function shortDate(value:string){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(`${value}T00:00:00Z`))}
function pointDetails(date:string,region:string,trips:ChartTrip[]){
  if(!trips.length)return "";
  const total=trips.reduce((sum,trip)=>sum+Number(trip.delivered_orders??0),0);
  const tripLines=trips.map((trip)=>`${trip.trip_number}: ${Number(trip.delivered_orders??0)} orders`).join("\n");
  return `${shortDate(date)}\n${region}\n${tripLines}\nTotal: ${total} orders`;
}
