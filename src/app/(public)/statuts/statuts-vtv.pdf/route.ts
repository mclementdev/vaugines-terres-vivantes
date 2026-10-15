import { pdfStatutsBase64 } from "@/lib/pdf/statuts";

export async function GET() {
  const pdf = Buffer.from(await pdfStatutsBase64(), "base64");
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="statuts-vaugines-terres-vivantes.pdf"',
    },
  });
}
