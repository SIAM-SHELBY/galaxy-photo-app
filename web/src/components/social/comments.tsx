"use client";

import { useState, useTransition } from "react";

import { addComment } from "@/actions/comments";

type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  author: { username: string | null; name: string | null; image: string | null };
};

export function Comments({
  photoId,
  initialComments,
  canComment,
}: {
  photoId: string;
  initialComments: CommentItem[];
  canComment: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [items, setItems] = useState<CommentItem[]>(initialComments);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-950">Comments</h2>
        <div className="text-xs text-neutral-500">{items.length}</div>
      </header>

      {canComment ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const text = body.trim();
            if (!text) return;

            startTransition(() => {
              const optimistic: CommentItem = {
                id: `optimistic-${Date.now()}`,
                body: text,
                createdAt: new Date().toISOString(),
                author: { username: null, name: "You", image: null },
              };
              setItems((prev) => [...prev, optimistic]);
              setBody("");

              void (async () => {
                try {
                  const created = await addComment({ photoId, body: text });
                  setItems((prev) => prev.filter((c) => c.id !== optimistic.id).concat(created));
                } catch {
                  setItems((prev) => prev.filter((c) => c.id !== optimistic.id));
                  setError("Could not post comment.");
                }
              })();
            });
          }}
          className="space-y-2"
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isPending}
            placeholder="Add a comment…"
            className="w-full resize-none rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60"
            rows={3}
            maxLength={1000}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending || body.trim().length === 0}
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {isPending ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-sm text-neutral-600">Sign in to comment.</div>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-neutral-600">No comments yet.</div>
        ) : (
          items.map((c) => (
            <div key={c.id} className="space-y-1">
              <div className="text-xs text-neutral-500">
                {c.author.username ? `@${c.author.username}` : c.author.name ?? ""}
              </div>
              <div className="text-sm text-neutral-900">{c.body}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
