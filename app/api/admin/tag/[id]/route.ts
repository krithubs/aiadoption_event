import { requireAdmin, jsonError } from "@/lib/http";
import { getRegistrationById } from "@/lib/storage";
import { makeNameTagPdf } from "@/lib/pdf";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const registration = await getRegistrationById(id);
  if (!registration) return jsonError("Registration not found.", 404);

  const pdf = await makeNameTagPdf(registration);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${registration.referenceCode}-name-tag.pdf"`,
    },
  });
}
