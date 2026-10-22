// Gera entregas/cti/descoberta/Matriz_CSD_CTI_GR1.docx (versão CTI da Matriz CSD, baseada em suposições do grupo)
// Uso: node scripts/generate_matriz_csd_cti.js (depois de npm install)
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign, PageOrientation,
} = require("docx");
const fs = require("fs");

const BLUE = "1F4E78";
const RED = "C00000";
const LIGHTBLUE = "D9EAF7";
const LIGHTYELLOW = "FFF2CC";
const GREEN = "E2EFDA";
const ORANGE = "FCE4D6";
const FONT = "Arial";
const BOX = "☐";

const numbering = {
  config: [
    {
      reference: "bullet-list",
      levels: [
        { level: 0, format: "bullet", text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 260 } } } },
      ],
    },
  ],
};

// ---------- helpers de texto ----------
function title(text) {
  return new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text, bold: true, size: 40, font: FONT, color: BLUE })] });
}
function h2(text) {
  return new Paragraph({ spacing: { before: 280, after: 120 }, children: [new TextRun({ text, bold: true, size: 26, font: FONT, color: RED })] });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 20, font: FONT, ...opts })] });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text, size: 20, font: FONT })] });
}
function boldLabel(label, rest) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: label, bold: true, size: 20, font: FONT }), new TextRun({ text: rest, size: 20, font: FONT })],
  });
}
function banner(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allBorders("C00000", 6),
    rows: [new TableRow({ children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: LIGHTYELLOW },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 19, font: FONT })] })],
    })] })],
  });
}

// ---------- helpers de tabela ----------
function allBorders(color = "000000", size = 4) {
  const b = { style: BorderStyle.SINGLE, size, color };
  return { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b };
}
// cell: string | { text, bold, fill, color }
function cell(c, isHeader) {
  const o = typeof c === "string" ? { text: c } : c;
  const lines = String(o.text ?? "").split("\n");
  return new TableCell({
    shading: isHeader ? { type: ShadingType.CLEAR, fill: LIGHTBLUE } : o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 70, bottom: 70, left: 90, right: 90 },
    children: lines.map((t) => new Paragraph({
      spacing: { after: 20 },
      children: [new TextRun({ text: t, bold: isHeader || o.bold, size: 18, font: FONT, color: isHeader ? BLUE : o.color || "000000" })],
    })),
  });
}
function table(widths, header, rows) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    borders: allBorders(),
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: header.map((h) => cell(h, true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c) => cell(c, false)) })),
    ],
  });
}
const status = `${BOX} Confirmada\n${BOX} Parcial\n${BOX} Errada`;
const spacer = () => new Paragraph({ spacing: { after: 80 }, children: [] });

const landscape = {
  page: {
    size: { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 },
    margin: { top: 900, bottom: 900, left: 900, right: 900 },
  },
};
const WL = 15038; // largura útil paisagem

// ======================================================================
// CERTEZAS: só o que tem fonte (plano de ensino, site da CTI, cronograma, relato do grupo)
// ======================================================================
const certezas = [
  ["C1", "A CTI é um provedor de internet corporativa, cloud e cibersegurança, com clientes empresariais (B2B), no mercado desde 1992.", "Site cti.com.br (08/10/2026)", "O \"avaliador\" é um cliente empresa, e não um consumidor final."],
  ["C2", "A CTI não tem um setor de análise de qualidade.", "Relato do grupo sobre a reunião com a empresa", "É a lacuna que o sistema precisa preencher: hoje ninguém analisa feedback de forma estruturada."],
  ["C3", "O escopo é um sistema que recebe e armazena avaliações dos serviços da CTI e gera relatórios para o time de gestão.", "Plano de Ensino v2 (Desafio)", "Define os dois blocos do produto: coleta/armazenamento e relatórios."],
  ["C4", "ChatBot e IA foram excluídos do escopo.", "Plano de Ensino v2 (Contextualização)", "A análise dos feedbacks precisa funcionar sem IA (regras, filtros, categorias)."],
  ["C5", "A CTI já mostra depoimentos de clientes no site e mantém um Portal do Cliente, ou seja, valoriza a opinião do cliente, mas sem processo estruturado de coleta.", "Site cti.com.br (08/10/2026)", "Há um ponto de contato natural para coletar feedback, mas é preciso confirmar se é usado para isso."],
  ["C6", "Os valores da CTI incluem excelência, atendimento humano, agilidade e transparência.", "Site cti.com.br, página \"Sobre a CTI\"", "O sistema deve medir esses valores (qualidade do suporte, rapidez, satisfação)."],
  ["C7", "A 1ª fase do programa exige só protótipo de baixa/média fidelidade; não será exigido software funcional.", "Cronograma oficial da turma (12 e 13/11)", "Limita a entrega. O Plano de Ensino fala em \"protótipo funcional\"; confirmar com o Prof. Paulo (ver D14)."],
].map(([id, t, o, i]) => [{ text: id, bold: true, fill: GREEN }, t, o, "Certa (com fonte)", i]);

// ======================================================================
// SUPOSIÇÕES: o grupo ainda não conversou com a CTI sobre estes pontos
// ======================================================================
const suposicoes = [
  ["S1", "O sistema funciona como um CRM focado em feedback: cadastro do cliente (empresa e contato), avaliações vinculadas a ele e acompanhamento do que foi feito com cada avaliação.", "Entendimento do Caio da reunião: \"algo como um CRM\". O núcleo é cliente + avaliação + histórico, e não um CRM completo de vendas."],
  ["S2", "Quem avalia são contatos de empresas clientes da CTI (TI, compras, diretoria), e não consumidores finais.", "Decorre de a CTI ser B2B. Pode incluir também usuários internos das empresas clientes."],
  ["S3", "Os serviços avaliados são internet/links, cloud, segurança, suporte técnico e atendimento comercial.", "São os blocos de oferta do site. O suporte deve ser o mais avaliado (aparece nos depoimentos)."],
  ["S4", "O gatilho principal da avaliação é o encerramento de um chamado de suporte, com uma pesquisa periódica por contrato como complemento.", "Padrão de mercado em provedores e TI. Gera avaliação no momento em que o cliente lembra da experiência."],
  ["S5", "A coleta é por um formulário curto, enviado por link (e-mail ou WhatsApp), com nota (CSAT ou NPS) e um comentário opcional.", "Responde à dor de \"ficha longa e chata\" do Mapa de Empatia. A pesquisa em si não precisa de app."],
  ["S6", "Os usuários internos são: gestores (leem relatórios), supervisores de suporte (tratam avaliações ruins) e comercial (consulta a satisfação antes de renovar).", "Perfis prováveis. Exige controle de acesso por perfil."],
  ["S7", "Os relatórios essenciais são: nota média por serviço e por período, evolução no tempo, ranking de motivos de reclamação, avaliações por técnico ou equipe e clientes com nota baixa.", "Responde ao que \"gestão de qualidade\" costuma acompanhar. A gestão precisa confirmar quais indicadores usa."],
  ["S8", "Avaliações negativas devem gerar uma tratativa (alerta, responsável, status e retorno ao cliente), e isso é o maior valor para a CTI.", "É o que diferencia um CRM de uma simples planilha de notas."],
  ["S9", "Sem IA, os comentários são classificados por categorias/etiquetas escolhidas manualmente ou por regras simples (palavras-chave).", "Consequência de C4. Dá para entregar análise útil sem processamento de linguagem."],
  ["S10", "No protótipo, os dados entram por cadastro manual ou importação de planilha (CSV). A integração com sistema de chamados e Portal do Cliente fica para uma fase seguinte.", "Reduz o risco técnico da 1ª fase. A integração depende de a CTI ter (e abrir) esses sistemas."],
  ["S11", "A gestão usa o sistema pelo navegador no desktop; o formulário de avaliação precisa funcionar bem no celular.", "Quem lê relatório trabalha em computador; quem avalia costuma abrir o link no celular."],
  ["S12", "Há cuidado com a LGPD: os dados dos contatos precisam de acesso restrito, e as avaliações devem poder ser anonimizadas nos relatórios.", "A CTI trabalha com segurança e dados; é de se esperar exigência."],
  ["S13", "A persona Adriana (consumidora de e-commerce) não representa mais o usuário principal e precisa ser revista ou substituída por uma persona do gestor da CTI e uma do cliente corporativo.", "As dores mudam: o gestor quer decidir com base em dados; o cliente quer avaliar sem perder tempo."],
].map(([id, t, h]) => [{ text: id, bold: true, fill: LIGHTYELLOW }, t, h, status, "", ""]);

// ======================================================================
// DÚVIDAS: perguntas para a próxima conversa com a CTI
// ======================================================================
const duvidas = [
  ["D1", "Como a CTI trata hoje reclamações e elogios de clientes? Quem é responsável?", "Alta", "Provavelmente o suporte ou o comercial, de forma informal (telefone, e-mail)."],
  ["D2", "Onde os feedbacks existem hoje (Portal do Cliente, e-mail, telefone, planilhas, depoimentos)?", "Alta", "Espalhados e sem registro central."],
  ["D3", "A CTI quer um CRM completo (vendas, contratos) ou só a parte de feedback e qualidade?", "Alta", "Só feedback e qualidade, com cadastro mínimo do cliente."],
  ["D4", "Quais indicadores a gestão quer acompanhar (NPS, CSAT, tempo de resposta, reincidência)?", "Alta", "CSAT por serviço e motivos de reclamação."],
  ["D5", "Quem vai avaliar: contato técnico, financeiro, diretoria? Um ou vários por empresa?", "Alta", "O contato técnico que abriu o chamado."],
  ["D6", "Quais serviços devem entrar no piloto?", "Média", "Suporte técnico e internet."],
  ["D7", "A CTI tem sistema de chamados ou ERP? Qual? Permite exportar dados?", "Média", "Tem sistema de chamados com exportação em planilha."],
  ["D8", "Qual o volume por mês (clientes ativos, chamados, avaliações esperadas)?", "Média", "Milhares de chamados e centenas de avaliações."],
  ["D9", "Quem usará o sistema internamente e com quais permissões?", "Média", "Gestão, supervisão do suporte e comercial."],
  ["D10", "Há exigência de hospedagem, segurança ou LGPD (por exemplo, uso dos data centers da CTI)?", "Média", "Sim, preferência por hospedagem própria e controle de acesso."],
  ["D11", "Como a CTI saberá que o sistema deu certo (indicador de sucesso)?", "Alta", "Aumento do volume de avaliações e queda das notas baixas sem tratativa."],
  ["D12", "A CTI tem disponibilidade para validar o protótipo depois (data e pessoa)?", "Alta", "Sim, com agendamento prévio."],
  ["D13", "O termo \"interativo\" no Desafio indica alguma expectativa de gamificação ou experiência diferente do formulário simples?", "Média", "Não; apenas uma avaliação fácil e rápida."],
  ["D14", "O Prof. Paulo exige protótipo ou software funcional na 1ª fase (Plano de Ensino × cronograma)?", "Alta", "Só protótipo, como diz o cronograma."],
].map(([id, t, pr, h]) => [{ text: id, bold: true, fill: ORANGE }, t, pr, h, `${BOX} Respondida\n${BOX} Segue em aberto`, ""]);

const matrizChildren = [
  title("Matriz CSD — GR1 / CTI (versão por suposições)"),
  boldLabel("Etapa: ", "6. Matriz CSD — 08/10/2026 (\"Análise das informações obtidas e atualização da Matriz CSD\") e 09/10/2026 (\"Redefinição/validação do problema e dos requisitos iniciais\")."),
  boldLabel("Empresa: ", "CTI (cti.com.br). Escopo: sistema de armazenamento e análise de feedbacks dos serviços, com relatórios para a gestão. ChatBot e IA fora."),
  boldLabel("Base: ", "Plano de Ensino v2 (Contextualização e Desafio), site da CTI, cronograma da turma e relato do grupo. Substitui, para a CTI, a Matriz_CSD_Pre_Preenchida_GR1 (versão Avanade, mantida como histórico)."),
  spacer(),
  banner("SUPOSIÇÕES DO GRUPO. Ainda não conversamos com a CTI sobre estes pontos. Só as Certezas têm fonte; as Suposições e as hipóteses das Dúvidas são palpites a validar. Marque o veredito e a evidência somente com resposta real da empresa ou de usuários."),

  h2("Certezas"),
  p("Têm fonte documentada. Se a conversa com a CTI contradisser alguma, mover para Dúvidas."),
  table([700, 6600, 2600, 1500, 3638], ["ID", "Certeza", "Origem", "Status", "Implicação para o projeto"], certezas),

  h2("Suposições (a validar)"),
  p("Escolhas do grupo ainda não confirmadas. Veredito: Confirmada vira Certeza; Parcial vira Certeza ajustada + nova Dúvida; Errada sai e gera ajuste de rota."),
  table([700, 5000, 4300, 1600, 2300, 1138], ["ID", "Suposição", "Por que supomos isso", "Veredito", "Evidência / fonte real", "Novo status"], suposicoes),

  h2("Dúvidas (abertas)"),
  p("Só a conversa com a CTI (ou o docente, no caso de D14) resolve. A coluna Prioridade indica o que perguntar primeiro."),
  table([700, 5300, 1100, 3600, 2100, 2238], ["ID", "Dúvida", "Prioridade", "Hipótese do grupo", "Situação", "Resposta / evidência"], duvidas),

  h2("Novas descobertas (preencher após a conversa com a CTI)"),
  p("Itens que não estavam nesta matriz. Classificar como Certeza, Suposição ou Dúvida."),
  table([700, 6600, 1700, 3000, 3038], ["ID", "Descoberta", "Classe", "Fonte (empresa, usuário, pesquisa)", "Impacto"],
    ["N1", "N2", "N3", "N4"].map((id) => [id, "", `${BOX} C  ${BOX} S  ${BOX} D`, "", ""])),

  h2("Problema e requisitos iniciais (rascunho por suposição, para 09/10)"),
  p("Redação provisória baseada nas Suposições S1 a S13. Revisar assim que houver resposta da CTI."),
  table([3000, 12038], ["Item", "Redação provisória"], [
    ["Problema (1 frase)", "A CTI não tem um processo estruturado para coletar, armazenar e analisar o feedback de seus clientes sobre os serviços, e por isso a gestão não consegue medir a qualidade nem agir sobre os problemas."],
    ["Usuários prioritários", "Gestor da CTI (lê relatórios e decide); supervisor de suporte (trata avaliações ruins); contato do cliente corporativo (avalia). Ver S2, S6 e S13."],
    ["Requisitos essenciais", "1. Cadastro de clientes (empresa e contato).\n2. Formulário curto de avaliação por serviço, acessível por link.\n3. Armazenamento das avaliações vinculadas a cliente, serviço e data.\n4. Painel de relatórios com filtros por serviço e período.\n5. Perfis de acesso (gestão, suporte, comercial)."],
    ["Requisitos desejáveis", "Tratativa de avaliações negativas (responsável, status, retorno); categorização de comentários por etiquetas; exportação de relatórios (CSV/PDF); importação de planilha."],
    ["Restrições assumidas", "Sem ChatBot nem IA; 1ª fase só com protótipo; cuidado com LGPD; integrações ficam para depois."],
    ["Fora do escopo da 1ª fase", "ChatBot, IA, Realidade Aumentada, gamificação, integração com sistema de chamados, desenvolvimento do sistema funcional."],
  ]),

  h2("Próxima conversa com a CTI: roteiro mínimo"),
  p("Se só houver tempo para poucas perguntas, priorizar as dúvidas de prioridade Alta:"),
  bullet("D3 — CRM completo ou só feedback e qualidade (define o tamanho do projeto)."),
  bullet("D1 e D2 — como e onde o feedback chega hoje."),
  bullet("D4 e D11 — o que a gestão quer ver nos relatórios e como medirá o sucesso."),
  bullet("D5 — quem avalia."),
  bullet("D12 — disponibilidade para validar o protótipo (V1 em 30/10, V2 em 06/11)."),
  bullet("D14 — com o Prof. Paulo: protótipo ou software funcional."),
];

const matrizDoc = new Document({ numbering, sections: [{ properties: landscape, children: matrizChildren }] });

fs.mkdirSync("entregas/cti/descoberta", { recursive: true });
Packer.toBuffer(matrizDoc)
  .then((b) => fs.writeFileSync("entregas/cti/descoberta/Matriz_CSD_CTI_GR1.docx", b))
  .then(() => console.log("Matriz CTI ok"));
