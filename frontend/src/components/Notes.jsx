import { useCallback, useEffect, useState } from "react";
import { NotebookPen, Pencil, Trash2 } from "lucide-react";
import { api, errMsg, unwrap } from "../api";
import { EmptyState } from "@/components/page";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { displayName, relativeTime } from "@/lib/format";

export default function Notes({ projectId, canEdit }) {
  const toast = useToast();
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      api
        .get(`/notes/${projectId}`)
        .then((res) => setNotes(unwrap(res) || []))
        .catch((e) => {
          setNotes([]);
          toast(errMsg(e), { tone: "danger" });
        }),
    [projectId, toast],
  );

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      await load();
      if (message) toast(message, { tone: "success" });
      return true;
    } catch (e) {
      toast(errMsg(e), { tone: "danger" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {canEdit && (
        <form
          className="surface-card space-y-3 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => api.post(`/notes/${projectId}`, { content: draft.trim() }), "Note added")) setDraft("");
          }}
        >
          <Textarea
            aria-label="New note"
            rows={3}
            placeholder="Share an update, a decision or a link with the team"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="solid" disabled={busy || !draft.trim()}>
              Post note
            </Button>
          </div>
        </form>
      )}

      {notes === null ? (
        <>
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </>
      ) : notes.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No notes yet">
          {canEdit ? "Post the first one above." : "Admins can post notes for the whole team here."}
        </EmptyState>
      ) : (
        notes.map((n) => (
          <article key={n._id} className="surface-card p-4 sm:p-5">
            <header className="flex items-center gap-3">
              {typeof n.createdBy === "object" && <UserAvatar user={n.createdBy} className="size-7" />}
              <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                {typeof n.createdBy === "object" && (
                  <span className="font-medium text-foreground">{displayName(n.createdBy)} </span>
                )}
                <time dateTime={n.updatedAt}>{relativeTime(n.updatedAt || n.createdAt)}</time>
                {n.updatedAt !== n.createdAt && " (edited)"}
              </div>
              {canEdit && editingId !== n._id && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Edit note"
                    onClick={() => {
                      setEditingId(n._id);
                      setEditText(n.content);
                    }}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-danger/10 hover:text-danger"
                    aria-label="Delete note"
                    onClick={() => setDeleting(n)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              )}
            </header>

            {editingId === n._id ? (
              <div className="mt-3 space-y-2">
                <Textarea aria-label="Edit note" rows={4} value={editText} onChange={(e) => setEditText(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    disabled={busy || !editText.trim()}
                    onClick={async () => {
                      if (await run(() => api.put(`/notes/${projectId}/n/${n._id}`, { content: editText.trim() }), "Note saved"))
                        setEditingId(null);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{n.content}</p>
            )}
          </article>
        ))
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this note?"
        confirmLabel="Delete note"
        busyLabel="Deleting"
        cancelLabel="Keep it"
        busy={busy}
        onConfirm={async () => {
          await run(() => api.delete(`/notes/${projectId}/n/${deleting._id}`), "Note deleted");
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      >
        Everyone in the project will lose access to it. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
