"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logout } from "@/app/login/actions";

type NavItem={label:string;href:string};
type NavGroup={label:string;icon:"grid"|"people"|"truck"|"ledger"|"payroll"|"ai";items:NavItem[]};

const groups:NavGroup[]=[
  {label:"Dashboard",icon:"grid",items:[{label:"Trips dashboard",href:"/"},{label:"Accounting overview",href:"/accounting"}]},
  {label:"Staff",icon:"people",items:[{label:"Drivers",href:"/drivers"},{label:"Employees",href:"/employees"}]},
  {label:"Trips",icon:"truck",items:[{label:"New trip",href:"/trips#new-trip"},{label:"Trip fuel",href:"/accounting/trip-expenses"},{label:"Trip list",href:"/trips#trip-list"},{label:"Regions",href:"/regions"},{label:"Vehicles",href:"/vehicles"}]},
  {label:"Accounting",icon:"ledger",items:[{label:"Overview",href:"/accounting"},{label:"Chart of accounts",href:"/accounting/accounts"},{label:"Suppliers",href:"/accounting/suppliers"},{label:"Invoices",href:"/accounting/invoices"},{label:"Expenses",href:"/accounting/expenses"},{label:"Payments",href:"/accounting/payments"},{label:"General ledger",href:"/accounting/ledger"}]},
  {label:"Payroll",icon:"payroll",items:[{label:"Payroll overview",href:"/payroll"},{label:"Commission schemes",href:"/payroll/commission"}]},
  {label:"AI Assistant",icon:"ai",items:[{label:"Ask SRT",href:"/assistant"}]},
];

export function AppShell({children}:{children:ReactNode}){
  const pathname=usePathname();const[mobileOpen,setMobileOpen]=useState(false);
  if(pathname==="/login")return <>{children}</>;
  return <div className="app-shell">
    <button className="mobile-menu-button" onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Icon name="menu"/><span>Menu</span></button>
    {mobileOpen&&<button className="sidebar-scrim" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"/>}
    <aside className={`app-sidebar ${mobileOpen?"is-open":""}`}>
      <div className="brand-block"><div className="brand-logo"><Image src="/srt-logo.jpeg" alt="SRT" width={58} height={58} priority/></div><div><p className="brand-name">SRT Logistics</p><p className="brand-caption">Be Smart</p></div><button className="sidebar-close" onClick={()=>setMobileOpen(false)} aria-label="Close navigation">×</button></div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {groups.map(group=><NavGroup key={group.label} group={group} pathname={pathname} close={()=>setMobileOpen(false)}/>) }
      </nav>
      <div className="sidebar-footer"><Link href="/backup" onClick={()=>setMobileOpen(false)}><Icon name="backup"/>Backup</Link><Link href="/settings" onClick={()=>setMobileOpen(false)}><Icon name="settings"/>Settings</Link><form action={logout}><button><Icon name="logout"/>Sign out</button></form></div>
    </aside>
    <div className="app-content">{children}</div>
  </div>
}

function NavGroup({group,pathname,close}:{group:NavGroup;pathname:string;close:()=>void}){
  const active=group.items.some(item=>item.href==="/"?pathname==="/":pathname.startsWith(item.href.split("#")[0]));
  return <details className="nav-group" open={active}><summary><span className="nav-group-label"><Icon name={group.icon}/>{group.label}</span><Icon name="chevron"/></summary><div className="nav-children">{group.items.map(item=>{const base=item.href.split("#")[0];const exact=item.href==="/"?pathname==="/":pathname===base;return <Link key={item.href} href={item.href} onClick={close} className={exact?"active":""}>{item.label}</Link>})}</div></details>
}

function Icon({name}:{name:string}){const common={width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};const paths:Record<string,ReactNode>={grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,people:<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 1 0 7.75"/></>,truck:<><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,ledger:<><path d="M4 4h16v16H4zM8 2v4M16 2v4M8 10h8M8 14h5"/></>,payroll:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h4M15 13h2"/></>,ai:<><path d="M12 3l1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14ZM6 13l.7 1.8 1.8.7-1.8.7L6 18l-.7-1.8-1.8-.7 1.8-.7L6 13Z"/></>,backup:<><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.08V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9v.01A1.7 1.7 0 0 0 20.92 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z"/></>,logout:<><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h7v18h-7"/></>,menu:<><path d="M4 6h16M4 12h16M4 18h16"/></>,chevron:<path d="m9 18 6-6-6-6"/>};return <svg {...common}>{paths[name]}</svg>}
