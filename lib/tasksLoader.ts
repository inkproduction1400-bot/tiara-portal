// lib/tasksLoader.ts
export type Task = {
    title: string;
    start?: string;   // YYYY-MM-DD
    end?: string;     // YYYY-MM-DD
    started?: boolean;
    done?: boolean;
    progress?: number; // 0..100
    owner?: string;
    status?: string;
  };
  
  export async function loadTasks(): Promise<Task[]> {
    try {
      const r = await fetch('/api/tasks');
      if (r.ok) {
        const json = await r.json();
        return Array.isArray(json?.tasks) ? json.tasks : Array.isArray(json) ? json : [];
      }
    } catch {}
    const r2 = await fetch('/data/tasks.json');
    return await r2.json();
  }
  