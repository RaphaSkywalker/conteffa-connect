import { Resend } from 'npm:resend@4';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'contato@conteffa.com.br';
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
    const {
      nomeCompleto, email, ateffa, cargo, cidade, data,
      hotel, tamanhoCamiseta, acompanhantes, quantosAcompanhantes,
    } = await req.json();

    if (!email || !nomeCompleto) {
      return new Response(JSON.stringify({ error: 'Nome e email são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const acompInfo = acompanhantes === 'SIM'
      ? `${quantosAcompanhantes || '0'} acompanhante(s)`
      : 'Nenhum';

    const primeiroNome = nomeCompleto.split(' ')[0];
    const dataEmail = data || new Date().toLocaleDateString('pt-BR');

    // ─── EMAIL PARA O PARTICIPANTE ───────────────────────────────────────────
    const participanteHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmação de Inscrição - IX CONTEFFA</title>
</head>
<body style="margin:0;padding:0;background-color:#0a1628;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a1628;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a6e 0%,#0f2347 100%);border-radius:20px 20px 0 0;padding:40px 40px 30px;text-align:center;border-bottom:3px solid #c8a951;">
              <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:900;letter-spacing:-1px;">IX CONTEFFA</h1>
              <p style="margin:10px 0 0;color:#8faad4;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Confirmação de Inscrição</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#122442;padding:40px;">
              <!-- Success Badge -->
              <div style="text-align:center;margin-bottom:35px;">
                <div style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);border-radius:50%;width:70px;height:70px;line-height:70px;font-size:32px;text-align:center;">✅</div>
                <h2 style="color:#ffffff;font-size:22px;font-weight:800;margin:15px 0 8px;">Parabéns, ${primeiroNome}! 🎉</h2>
                <p style="color:#6b8db8;font-size:15px;margin:0;">Sua inscrição foi confirmada com sucesso!</p>
              </div>
              <!-- Message -->
              <div style="background:#1a3358;border-radius:16px;padding:28px;margin-bottom:28px;border:1px solid #2a4a7a;">
                <p style="color:#c8e0ff;font-size:15px;line-height:1.7;margin:0 0 14px;">Ficamos muito felizes em confirmar que você está oficialmente inscrito no <strong style="color:#c8a951;">IX Congresso dos Trabalhadores com Formação em Atividades do MAPA — CONTEFFA</strong>.</p>
                <p style="color:#c8e0ff;font-size:15px;line-height:1.7;margin:0;">Prepare-se para um evento incrível repleto de aprendizados, networking e conquistas para a nossa categoria!</p>
                <p style="margin:18px 0 0;text-align:center;font-size:20px;font-weight:900;color:#c8a951;letter-spacing:1px;">🚀 Te vejo no IX CONTEFFA!</p>
              </div>
              <!-- Details Table -->
              <h3 style="color:#c8a951;font-size:12px;font-weight:800;letter-spacing:4px;text-transform:uppercase;margin:0 0 16px;">📋 Seus Dados de Inscrição</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr style="background:#1a3358;">
                  <td style="padding:14px 18px;color:#6b8db8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:40%;">Nome</td>
                  <td style="padding:14px 18px;color:#e2eeff;font-size:14px;font-weight:600;">${nomeCompleto}</td>
                </tr>
                <tr style="background:#152c52;">
                  <td style="padding:14px 18px;color:#6b8db8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">E-mail</td>
                  <td style="padding:14px 18px;color:#e2eeff;font-size:14px;font-weight:600;">${email}</td>
                </tr>
                <tr style="background:#1a3358;">
                  <td style="padding:14px 18px;color:#6b8db8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Associação</td>
                  <td style="padding:14px 18px;color:#e2eeff;font-size:14px;font-weight:600;">${ateffa || '—'}</td>
                </tr>
                <tr style="background:#152c52;">
                  <td style="padding:14px 18px;color:#6b8db8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Cargo</td>
                  <td style="padding:14px 18px;color:#e2eeff;font-size:14px;font-weight:600;">${cargo || '—'}</td>
                </tr>
                <tr style="background:#1a3358;">
                  <td style="padding:14px 18px;color:#6b8db8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Cidade</td>
                  <td style="padding:14px 18px;color:#e2eeff;font-size:14px;font-weight:600;">${cidade || '—'}</td>
                </tr>
                <tr style="background:#152c52;">
                  <td style="padding:14px 18px;color:#6b8db8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Hotel</td>
                  <td style="padding:14px 18px;color:#e2eeff;font-size:14px;font-weight:600;">${hotel || '—'}</td>
                </tr>
                <tr style="background:#1a3358;">
                  <td style="padding:14px 18px;color:#6b8db8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Camiseta</td>
                  <td style="padding:14px 18px;color:#e2eeff;font-size:14px;font-weight:600;">${tamanhoCamiseta || '—'}</td>
                </tr>
                <tr style="background:#152c52;">
                  <td style="padding:14px 18px;color:#6b8db8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Acompanhante(s)</td>
                  <td style="padding:14px 18px;color:#e2eeff;font-size:14px;font-weight:600;">${acompInfo}</td>
                </tr>
                <tr style="background:#1a3358;">
                  <td style="padding:14px 18px;color:#6b8db8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Data</td>
                  <td style="padding:14px 18px;color:#e2eeff;font-size:14px;font-weight:600;">${dataEmail}</td>
                </tr>
              </table>
              <!-- Status Badge -->
              <div style="background:linear-gradient(135deg,#854d0e,#713f12);border-radius:12px;padding:16px 20px;margin-bottom:28px;border:1px solid #a16207;text-align:center;">
                <span style="color:#fde68a;font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">⏳ Status: Pendente de Confirmação</span>
                <p style="color:#fbbf24;font-size:12px;margin:6px 0 0;">Nossa equipe irá revisar sua inscrição em breve.</p>
              </div>
              <!-- Contact -->
              <div style="text-align:center;">
                <p style="color:#4a6a9a;font-size:13px;margin:0;">Dúvidas? Entre em contato: <a href="mailto:${ADMIN_EMAIL}" style="color:#c8a951;text-decoration:none;font-weight:700;">${ADMIN_EMAIL}</a></p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0f1f3d;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;">
              <p style="color:#2a4a7a;font-size:11px;margin:0;font-weight:600;letter-spacing:2px;text-transform:uppercase;">© 2026 CONTEFFA — ANTEFFA · Todos os direitos reservados</p>
              <p style="color:#1e3a6a;font-size:10px;margin:8px 0 0;">Este é um email automático, por favor não responda.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // ─── EMAIL DE CÓPIA PARA O ADMIN ─────────────────────────────────────────
    const adminHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Nova Inscrição - IX CONTEFFA</title></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a3a6e,#0f2347);border-radius:20px 20px 0 0;padding:32px 40px;text-align:center;border-bottom:3px solid #c8a951;">
            <p style="margin:0 0 6px;color:#c8a951;font-size:10px;font-weight:800;letter-spacing:5px;text-transform:uppercase;">ADMIN · NOVA INSCRIÇÃO</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:900;">IX CONTEFFA</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#122442;padding:36px 40px;">
            <div style="background:#1a3358;border-radius:14px;padding:24px;margin-bottom:24px;border-left:4px solid #22c55e;">
              <p style="color:#86efac;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px;">🎉 Nova inscrição recebida!</p>
              <p style="color:#4ade80;font-size:22px;font-weight:900;margin:0;">${nomeCompleto}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;">
              <tr style="background:#1a3358;"><td style="padding:13px 18px;color:#6b8db8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:38%;">E-mail</td><td style="padding:13px 18px;color:#e2eeff;font-size:13px;">${email}</td></tr>
              <tr style="background:#152c52;"><td style="padding:13px 18px;color:#6b8db8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Associação</td><td style="padding:13px 18px;color:#e2eeff;font-size:13px;">${ateffa || '—'}</td></tr>
              <tr style="background:#1a3358;"><td style="padding:13px 18px;color:#6b8db8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Cargo</td><td style="padding:13px 18px;color:#e2eeff;font-size:13px;">${cargo || '—'}</td></tr>
              <tr style="background:#152c52;"><td style="padding:13px 18px;color:#6b8db8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Cidade</td><td style="padding:13px 18px;color:#e2eeff;font-size:13px;">${cidade || '—'}</td></tr>
              <tr style="background:#1a3358;"><td style="padding:13px 18px;color:#6b8db8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Hotel</td><td style="padding:13px 18px;color:#e2eeff;font-size:13px;">${hotel || '—'}</td></tr>
              <tr style="background:#152c52;"><td style="padding:13px 18px;color:#6b8db8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Camiseta</td><td style="padding:13px 18px;color:#e2eeff;font-size:13px;">${tamanhoCamiseta || '—'}</td></tr>
              <tr style="background:#1a3358;"><td style="padding:13px 18px;color:#6b8db8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Acompanhantes</td><td style="padding:13px 18px;color:#e2eeff;font-size:13px;">${acompInfo}</td></tr>
              <tr style="background:#152c52;"><td style="padding:13px 18px;color:#6b8db8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Data Inscrição</td><td style="padding:13px 18px;color:#e2eeff;font-size:13px;">${dataEmail}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#0f1f3d;border-radius:0 0 20px 20px;padding:20px 40px;text-align:center;">
            <p style="color:#2a4a7a;font-size:10px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:2px;">IX CONTEFFA — Sistema de Inscrições</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // ─── ENVIO PARALELO DOS DOIS EMAILS ──────────────────────────────────────
    const [participanteResult, adminResult] = await Promise.allSettled([
      resend.emails.send({
        from: FROM_EMAIL,
        to: [email],
        subject: '✅ Inscrição Confirmada — IX CONTEFFA',
        html: participanteHtml,
      }),
      resend.emails.send({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `📋 Nova Inscrição: ${nomeCompleto} — IX CONTEFFA`,
        html: adminHtml,
      }),
    ]);

    const participanteSent = participanteResult.status === 'fulfilled' && !participanteResult.value.error;
    const adminSent = adminResult.status === 'fulfilled' && !adminResult.value.error;

    if (!participanteSent) {
      console.error('Email participante falhou:', participanteResult);
    }
    if (!adminSent) {
      console.error('Email admin falhou:', adminResult);
    }

    return new Response(
      JSON.stringify({ success: true, participanteSent, adminSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Erro na Edge Function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
