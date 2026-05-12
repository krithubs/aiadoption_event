import { requireAdmin, jsonError } from "@/lib/http";
import { listRegistrations, readStoredDocument } from "@/lib/storage";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const registrations = await listRegistrations();
  const document = registrations.flatMap((registration) => registration.documents).find((item) => item.id === id);
  if (!document) return jsonError("Document not found.", 404);

  const bytes = await readStoredDocument(document.storedName);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `attachment; filename="${document.originalName}"`,
    },
  });
}
