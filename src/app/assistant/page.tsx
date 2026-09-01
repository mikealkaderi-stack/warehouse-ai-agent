import { requireUser } from "@/lib/auth";
import { AssistantChat } from "./assistant-chat";

export default async function AssistantPage() {
  await requireUser();
  return <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">SRT INTELLIGENCE</p>
      <h1 className="page-title">AI Assistant</h1>
      <p className="page-lead">Ask questions about trips, drivers, cash, expenses, suppliers, accounts, and payroll. This version is read-only.</p>
      <AssistantChat />
    </div>
  </main>;
}
