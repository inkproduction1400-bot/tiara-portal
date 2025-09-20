// pages/progress.tsx
import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { loadTasks, type Task } from "../lib/tasksLoader";

function weekRange(base: dayjs.Dayjs) {
  return { start: base.startOf("week"), end: base.endOf("week") };
}
function overlapsWeek(start: string | undefined, end: string | undefined, wkStart: dayjs.Dayjs, wkEnd: dayjs.Dayjs) {
  const ymd = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? dayjs(s).startOf("day") : null);
  if (!start && !end) return false;
  const s = ymd(start) ?? dayjs("1900-01-01");
  const e = ymd(end) ?? dayjs("2999-12-31");
  return s.isBefore(wkEnd) && e.isAfter(wkStart);
}

function ProgressInner() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await loadTasks();
        setTasks(data);
        setLoading(false);
      } catch (e: any) {
        setError(e?.message || "読み込み中にエラーが発生しました");
        setLoading(false);
      }
    })();
  }, []);

  const summary = useMemo(() => {
    if (tasks.length === 0) return { avg: 0, total: 0, started: 0, finished: 0 };
    const avg = Math.round(tasks.reduce((acc, t) => acc + (t.progress ?? 0), 0) / tasks.length);
    const now = dayjs();
    const ymd = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? dayjs(s).startOf("day") : null);
    const started = tasks.filter((t) => (t.start && ymd(t.start)?.isBefore(now)) || t.started).length;
    const finished = tasks.filter((t) => t.progress === 100 || t.done).length;
    return { avg, total: tasks.length, started, finished };
  }, [tasks]);

  const now = dayjs();
  const thisWeek = weekRange(now);
  const nextWeek = weekRange(now.add(1, "week"));

  const tasksThisWeek = useMemo(
    () => tasks.filter((t) => overlapsWeek(t.start, t.end, thisWeek.start, thisWeek.end)),
    [tasks, thisWeek.start, thisWeek.end]
  );
  const tasksNextWeek = useMemo(
    () => tasks.filter((t) => overlapsWeek(t.start, t.end, nextWeek.start, nextWeek.end)),
    [tasks, nextWeek.start, nextWeek.end]
  );

  return (
    <>
      <Head><title>進捗ダッシュボード</title></Head>
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>📈 進捗ダッシュボード</h1>

        {loading && <p>読み込み中...</p>}
        {error && <p style={{ color: "crimson" }}>エラー：{error}</p>}

        {!loading && !error && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", margin: "16px 0" }}>
              <Card title="平均進捗"><Big>{summary.avg}%</Big></Card>
              <Card title="タスク総数"><Big>{summary.total}</Big></Card>
              <Card title="開始済み"><Big>{summary.started}</Big></Card>
              <Card title="完了済み"><Big>{summary.finished}</Big></Card>
            </div>

            <Section title={`🗓 今週 (${thisWeek.start.format("YYYY/MM/DD")} - ${thisWeek.end.format("YYYY/MM/DD")})`} tasks={tasksThisWeek} />
            <Section title={`🗓 来週 (${nextWeek.start.format("YYYY/MM/DD")} - ${nextWeek.end.format("YYYY/MM/DD")})`} tasks={tasksNextWeek} />
          </>
        )}
      </main>
    </>
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
function Section(props: { title: string; tasks: Task[] }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ color: "#2563eb" }}>{props.title}</h2>
      {props.tasks.length === 0 ? (
        <p style={{ color: "#6b7280" }}>該当タスクはありません。</p>
      ) : (
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {props.tasks.map((t, i) => <TaskItem key={i} task={t} />)}
        </div>
      )}
    </section>
  );
}
function TaskItem({ task }: { task: Task }) {
  const start = task.start ?? "—";
  const end = task.end ?? "—";
  const pct = Math.max(0, Math.min(100, Math.round(task.progress ?? 0)));
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 600, color: "#111827" }}>{task.title}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{start} → {end}</div>
      </div>
      <div style={{ marginTop: 8, height: 10, background: "#f3f4f6", borderRadius: 999 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "#60a5fa" }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "#374151" }}>
        進捗: <strong>{pct}%</strong>
        {task.owner ? <>　/ 担当: {task.owner}</> : null}
        {task.status ? <>　/ 状態: {task.status}</> : null}
      </div>
    </div>
  );
}

function Progress() { return <ProgressInner />; }
export default dynamic(() => Promise.resolve(Progress), { ssr: false });
