import Link from "next/link";
export function PageTabs({items,current}:{items:{label:string;href:string;key:string}[];current:string}){return <nav className="page-tabs" aria-label="Page sections">{items.map(item=><Link key={item.key} href={item.href} className={current===item.key?"active":""}>{item.label}</Link>)}</nav>}

