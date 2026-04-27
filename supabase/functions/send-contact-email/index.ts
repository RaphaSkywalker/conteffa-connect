import { Resend } from 'npm:resend@4';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const ADMIN_EMAIL = 'congresso@anteffa.org.br';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'IX CONTEFFA <noreply@conteffa.com.br>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { nome, email, assunto, mensagem } = await req.json();

    if (!nome || !email || !mensagem) {
      return new Response(JSON.stringify({ error: 'Nome, email e mensagem são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contactHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Novo Contato - IX CONTEFFA</title></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a3a6e,#0f2347);border-radius:20px 20px 0 0;padding:32px 40px;text-align:center;border-bottom:3px solid #c8a951;">
            <p style="margin:0 0 6px;color:#c8a951;font-size:10px;font-weight:800;letter-spacing:5px;text-transform:uppercase;">SITE · MENSAGEM DE CONTATO</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:900;">IX CONTEFFA</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#122442;padding:36px 40px;">
            <div style="background:#1a3358;border-radius:14px;padding:24px;margin-bottom:24px;border-left:4px solid #c8a951;">
              <p style="color:#c8a951;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px;">📩 Nova mensagem recebida!</p>
              <p style="color:#ffffff;font-size:22px;font-weight:900;margin:0;">${nome}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <tr style="background:#1a3358;"><td style="padding:13px 18px;color:#6b8db8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:30%;">E-mail</td><td style="padding:13px 18px;color:#e2eeff;font-size:13px;">${email}</td></tr>
              <tr style="background:#152c52;"><td style="padding:13px 18px;color:#6b8db8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Assunto</td><td style="padding:13px 18px;color:#e2eeff;font-size:13px;">${assunto || 'Contato Geral'}</td></tr>
              <tr style="background:#1a3358;"><td style="padding:13px 18px;color:#6b8db8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Data</td><td style="padding:13px 18px;color:#e2eeff;font-size:13px;">${new Date().toLocaleString('pt-BR')}</td></tr>
            </table>
            
            <h3 style="color:#c8a951;font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">Mensagem:</h3>
            <div style="background:#1a3358;border-radius:12px;padding:24px;color:#e2eeff;font-size:14px;line-height:1.6;border:1px solid #2a4a7a;white-space:pre-wrap;">
              ${mensagem}
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#0f1f3d;border-radius:0 0 20px 20px;padding:20px 40px;text-align:center;">
            <p style="color:#2a4a7a;font-size:10px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:2px;">IX CONTEFFA — Formulário de Contato</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `Contato CONTEFFA: ${assunto || nome}`,
      html: contactHtml,
      reply_to: email,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
