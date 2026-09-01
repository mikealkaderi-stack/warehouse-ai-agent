import { backupTables, readAllRows } from "@/lib/backup";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await Promise.all(
      backupTables.map(async (table) => [table, await readAllRows(table)] as const),
    );
    const generatedAt = new Date().toISOString();
    const payload = {
      format: "srt-driver-control-backup",
      version: 1,
      generated_at: generatedAt,
      tables: Object.fromEntries(results),
    };
    const stamp = generatedAt.replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="srt-data-backup-${stamp}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
