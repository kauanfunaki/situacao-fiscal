import { NextRequest } from "next/server";
import { obterCertidaoPdf } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { cnpj: string } }
) {
  const cnpj = (params.cnpj || "").replace(/\D/g, "");
  if (cnpj.length !== 14) {
    return new Response("CNPJ inválido", { status: 400 });
  }

  const cert = await obterCertidaoPdf(cnpj);
  if (!cert) {
    return new Response("Certidão não disponível para este CNPJ.", { status: 404 });
  }

  const body = new Uint8Array(cert.pdf);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${cert.arquivo}"`,
      "Content-Length": String(body.length),
      "Cache-Control": "no-store",
    },
  });
}
