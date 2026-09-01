import { csvColumns, isBackupTable, readAllRows, toCsv } from "@/lib/backup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const table = new URL(request.url).searchParams.get("table");
  if (!isBackupTable(table)) {
    return Response.json({ error: "Invalid export type." }, { status: 400 });
  }

  try {
    const rows = await readAllRows(table);
    const csv = toCsv(rows, csvColumns[table]);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="srt-${table}-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
