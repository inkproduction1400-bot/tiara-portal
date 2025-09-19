import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import dayjs, { Dayjs } from "dayjs";

const headerHints = {
  title: ["タスク", "タスク名", "項目", "Task", "Title", "Subject"],
  start: ["開始", "開始日", "Start"],
  end: ["終了", "終了日", "End", "Due"],
  progress: ["進捗", "進捗率", "%", "Progress"],
  owner: ["担当", "担当者", "Owner", "Assignee"],
  status: ["状態", "ステータス", "Status"],
};

function weekRange(base: Dayjs) {
  const start = base.startOf("week"); // 月曜始まりにしたい場合: start.add(1,"day")
  const end = base.endOf("week");
  return { start, end };
}
function overlapsWeek(start: Dayjs | null, end: Dayjs | null, wkStart: Dayjs, wkEnd: Dayjs) {
  if (!start && !end) return false;
  const s = start ?? dayjs("1900-01-01");
  const e = end ?? dayjs("2999-12-31");
  return s.isBefore(wkEnd) && e.isAfter(wkStart);
}
function normalizeProgress(v: any): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Math.max(0, Math.min(100, v));
  const s = String(v).trim().replace("%", "");
  const n = Number(s);
  return isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
}
function parseDate(v: any): Dayjs | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return dayjs(new Date(Date.UTC(d.y, (d.m || 1) - 1, d.d || 1, d.H || 0, d.M || 0, d.S || 0)));
  }
  const parsed = dayjs(v);
  return parsed.isValid() ? parsed : null;
}

type Row = {
  title: string;
  start: Dayjs | null;
  end: Dayjs | null;
  progress: number;
  owner?: string;
  status?: string;
};

export default function WbsProgress({ source = "/docs/WBSガントチャート.xlsx" }: { source?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(source);
        if (!res.ok) throw new Error("WBSファイルにアクセスできませんでした");
        const ab = await res.arrayBuffer();
        const wb = XLSX.read(ab, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (json.length === 0) throw new Error("WBSのシートにデータがありません");

        const headers = Object.keys(json[0] || {});
        const findHeader = (cands: string[]) =>
          headers.find((h) => cands.some((k) => h.toLowerCase().includes(k.toLowerCase()))) || null;

        const hTitle = findHeader(headerHints.title);
        const hStart = findHeader(headerHints.start);
        const hEnd = findHeader(headerHints.end);
        const hProg = findHeader(headerHints.progress);
        const hOwner = findHeader(headerHints.owner);
        const hStatus = findHeader(headerHints.status);
        if (!hTitle) throw new Error("『タスク名』に相当する列が見つかりませんでした（例：タスク/項目/Task）");

        const parsed: Row[] = json
          .map((r) => ({
            title: String(r[hTitle] ?? "").trim(),
            start: hStart ? parseDate(r[hStart]) : null,
            end: hEnd ? parseDate(r[hEnd]) : null,
            progress: hProg ? normalizeProgress(r[hProg]) : 0,
            owner: hOwner ? String(r[hOwner] ?? "") : "",
            status: hStatus ? String(r[hStatus] ?? "") : "",
          }))
          .filter((r) => r.title !== "");

        setRows(parsed);
        setLoading(false);
      } catch (e: any) {
        setError(e?.message || "読み込み中にエラーが発生しました");
        setLoading(false);
      }
    })();
  }, [source]);

  const summary = useMemo(() => {
    if (rows.length === 0) return { avg: 0, total: 0, started: 0, finished: 0 };
    const avg = Math.round(rows.reduce((acc, r) => acc + r.progress, 0) / rows.length);
    const now = dayjs();
    const started = rows.filter((r) => r.start && r.start.isBefore(now)).length;
    const finished = rows.filter((r) => r.progress >= 100 || (r.end && r.end.isBefore(now) && r.progress >= 99)).length;
    return { avg, total: rows.length, started, finished };
  }, [rows]);

  const now = dayjs();
  const thisWeek = weekRange(now);
  const nextWeek = weekRange(now.add(1, "week"));

  const tasksThisWeek = useMemo(
    () =>
      rows
        .filter((r) => overlapsWeek(r.start, r.end, thisWeek.start, thisWeek.end))
        .sort((a, b) => (a.start?.valueOf() || 0) - (b.start?.valueOf() || 0)),
    [rows, thisWeek.start, thisWeek.end]
  );

  const tasksNextWeek = useMemo(
    () =>
      rows
        .filter((r) => overlapsWeek(r.start, r.end, nextWeek.start, nextWeek.end))
        .sort((a, b) => (a.start?.valueOf() || 0) - (b.start?.valueOf() || 0)),
    [rows, nextWeek.start, nextWeek.end]
  );

  return (
    <div>
      {loading && <p>読み込み中...</p>}
      {error && <p style={{ color: "crimson" }}>エラー：{error}</p>}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, margin: "16px 0" }}>
            <Card title="平均進捗"><Big>{summary.avg}%</Big></Card>
            <Card title="タスク総数"><Big>{summary.total}</Big></Card>
            <Card title="開始済み"><Big>{summary.started}</Big></Card>
            <Card title="完了済み"><Big>{summary.finished}</Big></Card>
          </div>

          <Section title={`🗓 今週 (${thisWeek.start.format("YYYY/MM/DD")} - ${thisWeek.end.format("YYYY/MM/DD")})`} tasks={tasksThisWeek} />
          <Section title={`🗓 来週 (${nextWeek.start.format("YYYY/MM/DD")} - ${nextWeek.end.format("YYYY/MM/DD")})`} tasks={tasksNextWeek} />
        </>
      )}
    </div>
  );
}

function Card(props: { title: string; children: any }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{props.title}</div>
      <div>{props.children}</div>
    </div>
  );
}
function Big(props: { children: any }) {
  return <div style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>{props.children}</div>;
}
function Section(props: { title: string; tasks: Row[] }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ color: "#2563eb" }}>{props.title}</h2>
      {props.tasks.length === 0 ? (
        <p style={{ color: "#6b7280" }}>該当タスクはありません。</p>
      ) : (
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {props.tasks.map((t, i) => <TaskItem key={i} row={t} />)}
        </div>
      )}
    </section>
  );
}
function TaskItem({ row }: { row: Row }) {
  const start = row.start?.format("MM/DD") ?? "—";
  const end = row.end?.format("MM/DD") ?? "—";
  const pct = Math.max(0, Math.min(100, Math.round(row.progress)));
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 600, color: "#111827" }}>{row.title}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{start} → {end}</div>
      </div>
      <div style={{ marginTop: 8, height: 10, background: "#f3f4f6", borderRadius: 999 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "#60a5fa" }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "#374151" }}>
        進捗: <strong>{pct}%</strong>
        {row.owner ? <>　/ 担当: {row.owner}</> : null}
        {row.status ? <>　/ 状態: {row.status}</> : null}
      </div>
    </div>
  );
}
