const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outputPdfPath = path.resolve(__dirname, '../VALLOR_DOSSIE_MARKETING.pdf');
const tempHtmlPath = path.resolve(__dirname, '../scratch/marketing_dossie.html');

// Favicon SVG embedded
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="48" height="48">
  <defs>
    <linearGradient id="vallorCyanGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00A8FF" />
      <stop offset="50%" stop-color="#00E5FF" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
  </defs>
  <circle cx="128" cy="128" r="98" fill="none" stroke="url(#vallorCyanGrad)" stroke-width="44" stroke-linecap="round" />
</svg>`;

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Vallor - Dossiê Estratégico & Briefing de Marketing</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

    @page {
      size: A4;
      margin: 14mm 14mm 14mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      font-size: 10pt;
    }

    /* HEADER */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 14px;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 18px;
    }

    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-text h1 {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #0b1224;
      line-height: 1;
    }

    .brand-text span {
      font-size: 8.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #0284c7;
    }

    .doc-badge {
      text-align: right;
    }

    .doc-badge .tag {
      background: #0b1224;
      color: #ffffff;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      padding: 4px 10px;
      border-radius: 4px;
      display: inline-block;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .doc-badge .date {
      font-size: 8pt;
      color: #64748b;
    }

    /* HERO CALLOUT */
    .hero-box {
      background: linear-gradient(135deg, #0b1224 0%, #1e293b 100%);
      color: #ffffff;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 5px solid #00E5FF;
    }

    .hero-box h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .hero-box p {
      font-size: 9.5pt;
      color: #e2e8f0;
      line-height: 1.45;
    }

    /* SECTION HEADINGS */
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12pt;
      font-weight: 800;
      color: #0b1224;
      margin: 18px 0 10px 0;
      padding-bottom: 5px;
      border-bottom: 1.5px solid #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .section-title .num {
      background: #0284c7;
      color: #ffffff;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 8.5pt;
      font-weight: 800;
    }

    /* GRIDS & CARDS */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      page-break-inside: avoid;
    }

    .card.highlight {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .card.alert {
      background: #fff1f2;
      border-color: #fecdd3;
    }

    .card h3 {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .card.alert h3 {
      color: #be123c;
    }

    .card.highlight h3 {
      color: #15803d;
    }

    .card p, .card ul {
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.4;
    }

    .card ul {
      padding-left: 16px;
      margin-top: 4px;
    }

    /* TABLE */
    table.comp-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    table.comp-table th {
      background: #0b1224;
      color: #ffffff;
      text-align: left;
      padding: 8px 10px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.5px;
    }

    table.comp-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      line-height: 1.35;
    }

    table.comp-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    table.comp-table .td-feat {
      font-weight: 700;
      color: #0284c7;
      width: 28%;
    }

    table.comp-table .td-val {
      font-weight: 600;
      color: #0f172a;
      width: 36%;
    }

    table.comp-table .td-comp {
      color: #64748b;
      width: 36%;
    }

    /* QUOTE BOX */
    .quote-box {
      background: #f0f9ff;
      border-left: 4px solid #0284c7;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin: 10px 0 14px 0;
      font-size: 9pt;
      font-weight: 500;
      color: #0369a1;
      font-style: italic;
    }

    /* BADGES */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      margin-right: 4px;
      margin-bottom: 4px;
    }
    .badge-blue { background: #e0f2fe; color: #0369a1; }
    .badge-dark { background: #1e293b; color: #f8fafc; }
    .badge-green { background: #dcfce7; color: #15803d; }

    /* HOOK LIST */
    .hook-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #00E5FF;
      padding: 8px 12px;
      margin-bottom: 8px;
      border-radius: 0 4px 4px 0;
      page-break-inside: avoid;
    }

    .hook-item strong {
      color: #0b1224;
      font-size: 8.5pt;
      display: block;
      margin-bottom: 2px;
    }

    .hook-item span {
      color: #334155;
      font-size: 8.5pt;
      font-style: italic;
    }

    .page-break {
      page-break-before: always;
    }

    .footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- PÁGINA 1 -->
  <div class="header-bar">
    <div class="brand-wrap">
      ${faviconSvg}
      <div class="brand-text">
        <h1>VALLOR</h1>
        <span>Motor Omnichannel & IA Conversacional</span>
      </div>
    </div>
    <div class="doc-badge">
      <div class="tag">Dossiê Estratégico</div>
      <div class="date">Equipe de Marketing & Growth · Outubro/2026</div>
    </div>
  </div>

  <div class="hero-box">
    <h2>Declaração de Posicionamento Central</h2>
    <p>O <strong>Vallor</strong> é uma plataforma comercial SaaS de <strong>Atendimento Omnichannel, Inteligência Artificial de Vendas e CRM Integrado</strong>. Ele substitui chatbots engessados e automações frágeis por um motor próprio de alta escala conectado à API Oficial da Meta (WhatsApp Cloud), com atendimento autônomo 24/7, base de conhecimento em manuais da empresa e transbordo humano sem colisão.</p>
  </div>

  <div class="section-title">
    <span class="num">1</span>
    <span>O Problema Central: A Queima de Leads no WhatsApp</span>
  </div>

  <div class="grid-2">
    <div class="card alert">
      <h3>🔴 1. Demora Mortal no Primeiro Atendimento</h3>
      <p>O lead de anúncio manda mensagem no WhatsApp e espera de 40 minutos a horas para ser respondido. Na internet, <strong>um lead não respondido em 5 minutos esfria em 80%</strong>, migrando imediatamente para o concorrente.</p>
    </div>
    <div class="card alert">
      <h3>🔴 2. Vendedores Atolados no Braçal</h3>
      <p>Profissionais comerciais qualificados gastam <strong>70% do expediente</strong> respondendo perguntas repetitivas (*"qual o valor?", "onde fica?", "tem catálogo?"*) em vez de negociar e fechar vendas de alto valor.</p>
    </div>
    <div class="card alert">
      <h3>🔴 3. Chatbots "Burros" e Irritantes</h3>
      <p>Menus numéricos ultrapassados (*"digite 1 para vendas, 2 para suporte"*) geram frustração, sensação de descaso e abandono imediato, queimando o investimento de tráfego da empresa.</p>
    </div>
    <div class="card alert">
      <h3>🔴 4. Colisão de Atendimento (IA vs. Vendedor)</h3>
      <p>Em sistemas comuns, o vendedor assume a conversa e o robô responde por cima. Essa sobreposição desastrosa causa confusão, cancelamento de compras e vergonha para a marca.</p>
    </div>
    <div class="card alert">
      <h3>🔴 5. Risco Catastrófico de Banimento</h3>
      <p>O uso de soluções amadoras via "QR Code não-oficial" resulta em bloqueio sumário do número de WhatsApp da empresa, gerando apagão operacional e prejuízos irreparáveis.</p>
    </div>
    <div class="card alert">
      <h3>🔴 6. Descentralização e Cegueira Gerencial</h3>
      <p>Conversas espalhadas nos celulares pessoais dos atendentes sem CRM. O gestor não sabe o tempo de resposta, taxa de conversão e perde os clientes se o vendedor sair da empresa.</p>
    </div>
  </div>

  <div class="section-title">
    <span class="num">2</span>
    <span>A Grande Promessa de Valor da Solução</span>
  </div>

  <div class="quote-box">
    "Multiplicar a capacidade de vendas da sua empresa atendendo instantaneamente em menos de 3 segundos, 24 horas por dia, 7 dias por semana, qualificando o lead pelo nome e entregando a oportunidade pronta para o seu vendedor fechar."
  </div>

  <div class="grid-3">
    <div class="card highlight">
      <h3>⚡ Resposta em 3 Segundos</h3>
      <p>Atendimento imediato em qualquer dia e horário, garantindo que nenhum lead pago seja ignorado.</p>
    </div>
    <div class="card highlight">
      <h3>🎯 3x a 5x Mais Produtividade</h3>
      <p>A equipe comercial só atua nos leads quentes e qualificados, focando 100% no fechamento.</p>
    </div>
    <div class="card highlight">
      <h3>🛡️ Segurança Meta Oficial</h3>
      <p>Zero risco de banimento de número, conformidade total com LGPD e dados isolados por empresa.</p>
    </div>
  </div>

  <div class="footer">
    <span>Vallor Plataforma SaaS · Documento Confidencial para Criação de Campanhas</span>
    <span>Página 1 de 2</span>
  </div>

  <!-- PÁGINA 2 -->
  <div class="page-break"></div>

  <div class="header-bar">
    <div class="brand-wrap">
      ${faviconSvg}
      <div class="brand-text">
        <h1>VALLOR</h1>
        <span>Diferenciais Competitivos & Estratégia de Marketing</span>
      </div>
    </div>
    <div class="doc-badge">
      <div class="tag">Guia de Campanha</div>
      <div class="date">Briefing de Copy & Criativos</div>
    </div>
  </div>

  <div class="section-title">
    <span class="num">3</span>
    <span>Diferenciais de Mercado (Vallor vs. Concorrência)</span>
  </div>

  <table class="comp-table">
    <thead>
      <tr>
        <th>Recurso & Capacidade</th>
        <th>No Sistema VALLOR</th>
        <th>Ferramentas Comuns / Mercado</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="td-feat">Trava de Handoff (Anti-Colisão)</td>
        <td class="td-val">🔒 <strong>Bloqueio Imediato</strong>: No instante em que o vendedor digita, a IA é compulsoriamente pausada. Zero respostas duplicadas.</td>
        <td class="td-comp">Robôs que continuam respondendo e atrapalhando a conversa do atendente humano.</td>
      </tr>
      <tr>
        <td class="td-feat">Inteligência & Base de Conhecimento</td>
        <td class="td-val">🧠 <strong>RAG Especializado</strong>: A IA estuda PDFs, manuais e catálogos da empresa, tirando dúvidas técnicas como um vendedor sênior.</td>
        <td class="td-comp">Chatbots com respostas genéricas, rasas ou que "alucinam" informações erradas.</td>
      </tr>
      <tr>
        <td class="td-feat">Canal WhatsApp</td>
        <td class="td-val">🟢 <strong>Meta Cloud API Oficial</strong>: Homologação corporativa com garantia de estabilidade e selo de segurança.</td>
        <td class="td-comp">Gambiarras de QR Code pirata que vivem desconectando e tomam banimento frequente.</td>
      </tr>
      <tr>
        <td class="td-feat">CRM e Funil Kanban</td>
        <td class="td-val">📊 <strong>CRM Nativo Automatizado</strong>: A IA qualifica interesse, extrai dados e move o card no funil de vendas sem esforço humano.</td>
        <td class="td-comp">Necessidade de contratar outro software de CRM separado e integrar com webhooks frágeis.</td>
      </tr>
      <tr>
        <td class="td-feat">Mentoria Neural da IA</td>
        <td class="td-val">🎓 <strong>Treinamento Direto</strong>: O gestor ajusta a IA no chat interno (*"Sofia, mude esta resposta"*) e ela assimila na hora sem código.</td>
        <td class="td-comp">Exige reprogramar fluxogramas complexos ou depender de suporte técnico externo.</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">
    <span class="num">4</span>
    <span>Público-Alvo (ICP) & Decisores de Compra</span>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3>🏢 Nichos com Maior Taxa de Conversão</h3>
      <ul>
        <li><strong>Imobiliárias & Construtoras:</strong> Triagem de renda, bairro e agendamento de visitas.</li>
        <li><strong>Concessionárias & Veículos:</strong> Envio de estoque, simulações e test-drive.</li>
        <li><strong>Clínicas & Estética:</strong> Agendamento 24h, dúvidas e triagem de especialidade.</li>
        <li><strong>B2B, Distribuidores & Serviços:</strong> Energia solar, consultorias e contabilidade.</li>
      </ul>
    </div>
    <div class="card">
      <h3>👔 Quem Toma a Decisão de Contratação</h3>
      <ul>
        <li><strong>CEOs & Donos de PMEs:</strong> Querem vender mais sem inchar a folha de pagamento.</li>
        <li><strong>Diretores Comerciais:</strong> Precisam de velocidade, padrão de atendimento e controle.</li>
        <li><strong>Gestores de Tráfego:</strong> Querem salvar o ROI dos anúncios garantindo conversão.</li>
      </ul>
    </div>
  </div>

  <div class="section-title">
    <span class="num">5</span>
    <span>Arsenal para Campanhas: Ganchos (Hooks) & Slogans</span>
  </div>

  <div class="hook-item">
    <strong>Gancho 1 (Dor do Desperdício de Tráfego):</strong>
    <span>"Você sabe quantos clientes mandaram mensagem no seu WhatsApp hoje e desistiram de comprar porque ninguém respondeu na hora?"</span>
  </div>

  <div class="hook-item">
    <strong>Gancho 2 (Fim do Robô Engessado):</strong>
    <span>"Chega de robô com 'digite 1 ou digite 2'. Conheça a IA que atende seu cliente pelo nome, estuda os manuais da sua empresa e vende no WhatsApp."</span>
  </div>

  <div class="hook-item">
    <strong>Gancho 3 (Vendedor 24 Horas):</strong>
    <span>"E se o seu melhor vendedor trabalhasse sábado, domingo e de madrugada sem cansar, sem pedir comissão e atendendo em 3 segundos?"</span>
  </div>

  <div class="hook-item">
    <strong>Gancho 4 (Alívio Operacional para a Equipe):</strong>
    <span>"O seu tráfego não é ruim. O problema é que seu vendedor demora 40 minutos para responder. Automatize o filtro com o Vallor e entregue só o lead pronto para fechar."</span>
  </div>

  <div style="margin-top: 10px; margin-bottom: 8px;">
    <span class="badge badge-blue">Slogan Oficial: "Vallor: Inteligência que atende. CRM que converte."</span>
    <span class="badge badge-dark">Assinatura: "O fim da espera no WhatsApp comercial."</span>
    <span class="badge badge-green">Fórmula: "De lead curioso a cliente qualificado em segundos."</span>
  </div>

  <div class="footer">
    <span>Vallor Plataforma SaaS · Motor Omnichannel & IA Conversacional</span>
    <span>Página 2 de 2</span>
  </div>

</body>
</html>`;

fs.writeFileSync(tempHtmlPath, html, 'utf8');
console.log('HTML temporário salvo em:', tempHtmlPath);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const printCmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${outputPdfPath}" --no-pdf-header-footer "${tempHtmlPath}"`;

console.log('Gerando PDF executivo de alta fidelidade...');
execSync(printCmd, { stdio: 'inherit' });

if (fs.existsSync(outputPdfPath)) {
  const stats = fs.statSync(outputPdfPath);
  console.log('SUCESSO! PDF gerado em:', outputPdfPath);
  console.log('Tamanho:', (stats.size / 1024).toFixed(2), 'KB');
} else {
  console.error('ERRO: PDF não encontrado após a execução.');
  process.exit(1);
}
