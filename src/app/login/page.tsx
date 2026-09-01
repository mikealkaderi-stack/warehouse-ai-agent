import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAuthenticatedUser()) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/20">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-slate-950">SRT</div>
        <p className="mt-6 text-sm font-semibold tracking-[0.22em] text-emerald-400">PRIVATE APPLICATION</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Driver Control Login</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Sign in with the private account created for this application.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
