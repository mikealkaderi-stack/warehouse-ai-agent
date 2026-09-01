import Link from "next/link";

export function Pagination({
  basePath,
  currentPage,
  totalPages,
  params,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  params: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-5 flex items-center justify-between gap-4 text-sm" aria-label="List pages">
      <PageLink basePath={basePath} page={currentPage - 1} disabled={currentPage === 1} params={params}>
        ← Previous
      </PageLink>
      <span className="text-slate-400">Page {currentPage} of {totalPages}</span>
      <PageLink basePath={basePath} page={currentPage + 1} disabled={currentPage === totalPages} params={params}>
        Next →
      </PageLink>
    </nav>
  );
}

function PageLink({
  basePath,
  page,
  disabled,
  params,
  children,
}: {
  basePath: string;
  page: number;
  disabled: boolean;
  params: Record<string, string>;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="rounded-lg border border-slate-800 px-3 py-2 text-slate-600">{children}</span>;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  query.set("page", String(page));

  return (
    <Link
      href={`${basePath}?${query.toString()}`}
      className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:border-emerald-400/50 hover:text-emerald-300"
    >
      {children}
    </Link>
  );
}
