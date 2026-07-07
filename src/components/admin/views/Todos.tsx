"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Empty } from "../ui";

interface Todo {
  id: string;
  label: string;
  done: boolean;
  sort: number;
  created_at: string;
  done_at: string | null;
}

/**
 * The store's own setup / launch checklist, managed right in the backend.
 * Empty on a fresh store — one click seeds the standard new-store checklist
 * (mirrors docs/SETUP.md); custom items can be added, checked off, deleted.
 */
export function Todos({ token }: { token: string }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [ready, setReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    (json = false) => ({
      authorization: `Bearer ${token}`,
      ...(json ? { "content-type": "application/json" } : {}),
    }),
    [token],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/todos", { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load to-dos.");
      setReady(data.ready !== false);
      setTodos(data.todos ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    load();
  }, [load]);

  async function seed() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/todos", {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({ seed: true }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    const label = newLabel.trim();
    if (!label) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/todos", {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      if (res.ok && data.todo) {
        setTodos((t) => [...t, data.todo]);
        setNewLabel("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggle(todo: Todo) {
    // Optimistic — revert on failure.
    setTodos((t) =>
      t.map((x) => (x.id === todo.id ? { ...x, done: !todo.done } : x)),
    );
    const res = await fetch("/api/admin/todos", {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify({ id: todo.id, done: !todo.done }),
    });
    if (!res.ok) {
      setTodos((t) =>
        t.map((x) => (x.id === todo.id ? { ...x, done: todo.done } : x)),
      );
    }
  }

  async function remove(id: string) {
    const prev = todos;
    setTodos((t) => t.filter((x) => x.id !== id));
    const res = await fetch("/api/admin/todos", {
      method: "DELETE",
      headers: headers(true),
      body: JSON.stringify({ id }),
    });
    if (!res.ok) setTodos(prev);
  }

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              Store checklist
            </h2>
            {todos.length > 0 && (
              <p className="mt-0.5 text-[12.5px] text-[#8a8a84]">
                {doneCount} of {todos.length} done
              </p>
            )}
          </div>
          {todos.length > 0 && (
            <div className="h-2 w-40 overflow-hidden rounded-full bg-[#eeeeea]">
              <div
                className="h-full rounded-full bg-[#1f7a4d] transition-all"
                style={{
                  width: `${todos.length ? (doneCount / todos.length) * 100 : 0}%`,
                }}
              />
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[13.5px] text-[#9a2820]">{error}</p>
        ) : loading ? (
          <p className="text-[13.5px] text-[#8a8a84]">Loading …</p>
        ) : !ready ? (
          <Empty>
            The to-do list isn&apos;t set up yet. Run the{" "}
            <code className="rounded bg-[#eee] px-1">store_todos</code> SQL in
            Supabase (it&apos;s part of{" "}
            <code className="rounded bg-[#eee] px-1">supabase/schema.sql</code>
            ).
          </Empty>
        ) : todos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#ddddd6] px-6 py-8 text-center">
            <p className="text-[14px] text-[#6b6b66]">
              No to-dos yet. Start from the standard new-store setup checklist,
              or add your own below.
            </p>
            <button
              onClick={seed}
              disabled={busy}
              className="mt-4 rounded-lg bg-ink px-4 py-2 text-[13.5px] font-semibold text-cream transition-colors hover:bg-clay disabled:opacity-50"
            >
              {busy ? "Loading …" : "Load setup checklist"}
            </button>
          </div>
        ) : (
          <ul className="space-y-1">
            {todos.map((t) => (
              <li
                key={t.id}
                className="group flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#f7f7f4]"
              >
                <button
                  onClick={() => toggle(t)}
                  aria-label={t.done ? "Mark as not done" : "Mark as done"}
                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors ${
                    t.done
                      ? "border-[#1f7a4d] bg-[#1f7a4d] text-white"
                      : "border-[#c9c9c2] bg-white hover:border-ink"
                  }`}
                >
                  {t.done && (
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    >
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span
                  className={`flex-1 text-[13.5px] leading-snug ${
                    t.done ? "text-[#a3a39c] line-through" : "text-ink"
                  }`}
                >
                  {t.label}
                </span>
                <button
                  onClick={() => remove(t.id)}
                  aria-label="Delete"
                  className="mt-0.5 hidden shrink-0 text-[#c0c0b8] hover:text-[#9a2820] group-hover:block"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13h8l1-13" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {ready && !loading && !error && (
          <div className="mt-5 flex gap-2 border-t border-[#f0f0ec] pt-4">
            <input
              type="text"
              value={newLabel}
              placeholder="Add a to-do …"
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
              className="flex-1 rounded-lg border border-[#e2e2dd] px-3 py-2 text-[13.5px] text-ink outline-none transition-colors focus:border-ink"
            />
            <button
              onClick={add}
              disabled={busy || !newLabel.trim()}
              className="rounded-lg bg-ink px-4 py-2 text-[13.5px] font-semibold text-cream transition-colors hover:bg-clay disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
