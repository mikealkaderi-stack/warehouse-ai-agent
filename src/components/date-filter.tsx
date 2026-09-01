import Link from "next/link";
export function DateFilter({from,to,basePath,extra={}}:{from:string;to:string;basePath:string;extra?:Record<string,string>}){return <form method="get" className="date-filter-card">{Object.entries(extra).map(([key,value])=><input key={key} type="hidden" name={key} value={value}/>)}<label>From<input className="field" name="from" type="date" defaultValue={from}/></label><label>To<input className="field" name="to" type="date" defaultValue={to}/></label><button>Apply dates</button><Link href={basePath}>Reset</Link></form>}

