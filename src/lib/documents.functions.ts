import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const KINDS = [
  "electricity_bill",
  "fuel_receipt",
  "grocery_receipt",
  "water_bill",
  "other",
] as const;
export type DocumentKind = (typeof KINDS)[number];

export interface UserDocument {
  id: string;
  kind: DocumentKind;
  title: string | null;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  status: "processing" | "processed" | "failed";
  estimated_kg_co2: number | null;
  notes: string | null;
  document_date: string | null;
  created_at: string;
}

const recordSchema = z.object({
  kind: z.enum(KINDS),
  title: z.string().max(200).optional().nullable(),
  file_path: z.string().min(1).max(500),
  mime_type: z.string().max(100).optional().nullable(),
  size_bytes: z.number().int().nonnegative().optional().nullable(),
  estimated_kg_co2: z.number().nonnegative().optional().nullable(),
  status: z.enum(["processing", "processed", "failed"]).default("processed"),
  notes: z.string().max(500).optional().nullable(),
});

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserDocument[]> => {
    const { data, error } = await context.supabase
      .from("user_documents")
      .select(
        "id, kind, title, file_path, mime_type, size_bytes, status, estimated_kg_co2, notes, document_date, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as UserDocument[];
  });

export const recordDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => recordSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("user_documents")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("user_documents")
      .select("file_path")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (doc?.file_path) {
      await context.supabase.storage.from("documents").remove([doc.file_path]);
    }
    const { error } = await context.supabase
      .from("user_documents")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDocumentSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("user_documents")
      .select("file_path")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!doc?.file_path) throw new Error("Not found");
    const { data: signed, error } = await context.supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60 * 5);
    if (error || !signed) throw new Error(error?.message ?? "Could not sign URL");
    return { url: signed.signedUrl };
  });
