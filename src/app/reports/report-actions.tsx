"use client";

type ExportRow = {
  trip_number: string;
  trip_date: string;
  driver_name: string;
  region_name: string;
  vehicle_name: string;
  plate_number: string | null;
  assigned_orders: number;
  delivered_orders: number | null;
  undelivered_orders: number | null;
  success_rate: number | string | null;
  distance_km: number | string | null;
  total_payment_value: number | string;
  expected_cash: number | string;
  cash_handed: number | string | null;
  cash_difference: number | string | null;
  fuel_expense: number | string;
  other_expense: number | string;
  status: string;
};

export function ReportActions({ rows, from, to, reportName }: { rows: ExportRow[]; from: string; to: string; reportName: string }) {
  function downloadCsv() {
    const headers = [
      "Trip Number",
      "Date",
      "Driver",
      "Region",
      "Vehicle",
      "Plate Number",
      "Assigned",
      "Delivered",
      "Undelivered",
      "Success Rate",
      "Distance KM",
      "Total Payments",
      "Expected Cash",
      "Cash Handed",
      "Cash Difference",
      "Fuel Expense",
      "Other Expense",
      "Status",
    ];
    const values = rows.map((row) => [
      row.trip_number,
      row.trip_date,
      row.driver_name,
      row.region_name,
      row.vehicle_name,
      row.plate_number ?? "",
      row.assigned_orders,
      row.delivered_orders ?? "",
      row.undelivered_orders ?? "",
      row.success_rate ?? "",
      row.distance_km ?? "",
      row.total_payment_value,
      row.expected_cash,
      row.cash_handed ?? "",
      row.cash_difference ?? "",
      row.fuel_expense,
      row.other_expense,
      row.status,
    ]);
    const csv = [headers, ...values]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `srt-${reportName}-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="print-hidden flex flex-wrap gap-3">
      <button
        type="button"
        onClick={downloadCsv}
        disabled={rows.length === 0}
        className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40"
      >
        Download CSV
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-xl bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300"
      >
        Print report
      </button>
    </div>
  );
}

function csvCell(value: string | number) {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
