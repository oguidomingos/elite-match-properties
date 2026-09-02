// Envio de OTP/notificações via Evolution API (WhatsApp). Server-only.

export function normalizeWhatsapp(raw: string): string {
  let d = (raw ?? "").replace(/\D/g, "");
  // Assume Brasil quando vier sem DDI (10-11 dígitos = DDD + número).
  if (d.length >= 10 && d.length <= 11) d = "55" + d;
  return d;
}

export async function sendWhatsapp(numeroDigitos: string, texto: string): Promise<boolean> {
  const url = process.env["EVOLUTION_URL"];
  const key = process.env["EVOLUTION_APIKEY"];
  const instance = process.env["EVOLUTION_INSTANCE"];
  if (!url || !key || !instance) {
    console.warn("[evolution] credenciais ausentes — OTP não enviado:", texto);
    return false;
  }
  try {
    const res = await fetch(`${url}/message/sendText/${instance}`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: key },
      body: JSON.stringify({ number: numeroDigitos, text: texto }),
    });
    if (!res.ok) {
      console.error("[evolution] falha ao enviar:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[evolution] erro de rede:", e);
    return false;
  }
}
