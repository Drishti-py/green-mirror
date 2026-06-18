import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  listDocuments,
  recordDocument,
  deleteDocument,
  getDocumentSignedUrl,
  type UserDocument,
  type DocumentKind,
} from "@/lib/documents.functions";
import { Search, Trash2, Eye, Download, FileText } from "lucide-react";

const KINDS: { value: DocumentKind; label: string; emoji: string }[] = [
  { value: "electricity_bill", label: "Electricity bill", emoji: "⚡" },
  { value: "fuel_receipt", label: "Fuel receipt", emoji: "⛽" },
  { value: "grocery_receipt", label: "Grocery receipt", emoji: "🛒" },
  { value: "water_bill", label: "Water bill", emoji: "💧" },
  { value: "other", label: "Other", emoji: "📄" },
];

type SortKey = "newest" | "oldest" | "impact";

function DocumentsTabImpl() {
  const fetchList = useServerFn(listDocuments);
  const recordFn = useServerFn(recordDocument);
  const deleteFn = useServerFn(deleteDocument);
  const signFn = useServerFn(getDocumentSignedUrl);

  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState<DocumentKind | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [pendingKind, setPendingKind] = useState<DocumentKind>("electricity_bill");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchList();
      setDocs(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [fetchList]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Please use a file under 8 MB.");
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUploading(true);
      try {
        const safe = file.name.replace(/[^a-z0-9.-]/gi, "_");
        const path = `${u.user.id}/${pendingKind}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage.from("documents").upload(path, file);
        if (error) throw error;
        await recordFn({
          data: {
            kind: pendingKind,
            title: file.name,
            file_path: path,
            mime_type: file.type || null,
            size_bytes: file.size,
            status: "processed",
          },
        });
        toast.success("Document added.");
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [pendingKind, recordFn, refresh],
  );

  const handleView = useCallback(
    async (doc: UserDocument) => {
      try {
        const { url } = await signFn({ data: { id: doc.id } });
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not open");
      }
    },
    [signFn],
  );

  const handleDownload = useCallback(
    async (doc: UserDocument) => {
      try {
        const { url } = await signFn({ data: { id: doc.id } });
        const res = await fetch(url);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = doc.title ?? "document";
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Download failed");
      }
    },
    [signFn],
  );

  const handleDelete = useCallback(
    async (doc: UserDocument) => {
      if (!confirm(`Delete "${doc.title ?? "document"}"?`)) return;
      try {
        await deleteFn({ data: { id: doc.id } });
        setDocs((prev) => prev.filter((d) => d.id !== doc.id));
        toast.success("Deleted.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    },
    [deleteFn],
  );

  const visible = useMemo(() => {
    let out = docs;
    if (filterKind !== "all") out = out.filter((d) => d.kind === filterKind);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (d) =>
          (d.title ?? "").toLowerCase().includes(q) || d.kind.toLowerCase().includes(q),
      );
    }
    const sorted = [...out];
    if (sort === "newest") {
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (sort === "oldest") {
      sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
    } else {
      sorted.sort((a, b) => (b.estimated_kg_co2 ?? 0) - (a.estimated_kg_co2 ?? 0));
    }
    return sorted;
  }, [docs, filterKind, search, sort]);

  return (
    <div className="space-y-6">
      {/* Upload control */}
      <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            Add a new document
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setPendingKind(k.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                pendingKind === k.value
                  ? "bg-primary/15 border-primary/60 text-primary"
                  : "bg-background/40 border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span aria-hidden>{k.emoji}</span> {k.label}
            </button>
          ))}
        </div>
        <label
          htmlFor="doc-upload"
          className="block cursor-pointer rounded-xl border border-dashed border-border/60 bg-background/30 hover:border-primary/50 px-5 py-8 text-center text-sm transition-colors"
        >
          {uploading ? "Uploading…" : "Tap to choose a file (image or PDF, ≤ 8 MB)"}
          <input
            id="doc-upload"
            type="file"
            accept="image/*,application/pdf"
            disabled={uploading}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="pl-9 bg-card/40 border-border/60"
          />
        </div>
        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value as DocumentKind | "all")}
          className="bg-card/40 border border-border/60 rounded-md px-3 py-2 text-sm"
          aria-label="Filter by kind"
        >
          <option value="all">All kinds</option>
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-card/40 border border-border/60 rounded-md px-3 py-2 text-sm"
          aria-label="Sort"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="impact">Highest impact</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading documents…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
          {docs.length === 0
            ? "No documents yet. Upload your first one above."
            : "No documents match your filters."}
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((d) => (
            <DocumentRow
              key={d.id}
              doc={d}
              onView={handleView}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

const DocumentRow = memo(function DocumentRow({
  doc,
  onView,
  onDownload,
  onDelete,
}: {
  doc: UserDocument;
  onView: (d: UserDocument) => void;
  onDownload: (d: UserDocument) => void;
  onDelete: (d: UserDocument) => void;
}) {
  const kindLabel = KINDS.find((k) => k.value === doc.kind);
  return (
    <li className="rounded-xl border border-border/60 bg-card/40 backdrop-blur p-4 flex items-center gap-4 flex-wrap">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
        {kindLabel?.emoji ?? <FileText className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-[200px]">
        <div className="font-medium truncate">{doc.title ?? "Untitled"}</div>
        <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          {kindLabel?.label} · {new Date(doc.created_at).toLocaleDateString()}
          {" · "}
          <span
            className={
              doc.status === "processed"
                ? "text-primary"
                : doc.status === "failed"
                  ? "text-destructive"
                  : "text-amber-400"
            }
          >
            {doc.status}
          </span>
        </div>
      </div>
      <div className="text-right text-sm">
        <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Carbon impact
        </div>
        <div className="font-bold">
          {doc.estimated_kg_co2 != null
            ? `${Number(doc.estimated_kg_co2).toFixed(1)} kg`
            : "—"}
        </div>
      </div>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => onView(doc)} aria-label="View">
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDownload(doc)}
          aria-label="Download"
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(doc)}
          aria-label="Delete"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </li>
  );
});

export const DocumentsTab = memo(DocumentsTabImpl);
