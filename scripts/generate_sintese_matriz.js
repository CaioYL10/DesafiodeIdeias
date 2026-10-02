// Gera entregas/Sintese_Entrevista_Modelo_GR1.docx e entregas/Matriz_CSD_Pre_Preenchida_GR1.docx
// Uso: node scripts/generate_sintese_matriz.js (depois de npm install)
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign, PageOrientation,
} = require("docx");
const fs = require("fs");

const BLUE = "1F4E78";
const RED = "C00000";
const GRAY = "666666";
const LIGHTBLUE = "D9EAF7";
const LIGHTGRAY = "F2F2F2";
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
const blank = (n = 1) => Array.from({ length: n }, () => "");
const status = `${BOX} Confirmada\n${BOX} Parcial\n${BOX} Errada`;
const spacer = () => new Paragraph({ spacing: { after: 80 }, children: [] });

const portrait = { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } };
const landscape = {
  page: {
    size: { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 },
    margin: { top: 900, bottom: 900, left: 900, right: 900 },
  },
};

// ======================================================================
// 1) MODELO DA SÍNTESE DA ENTREVISTA
// ======================================================================
const W = 9706; // largura útil retrato

const perguntasResumo = [
  ["A", "Problema e processo atual", [
    ["1", "Principal problema (quantidade, qualidade, confiabilidade)"],
    ["2", "Como o processo de review funciona hoje"],
    ["3", "Em que momento o usuário abandona"],
    ["4", "Consequências do baixo engajamento"],
    ["5", "Estratégias já tentadas pela empresa"],
    ["6", "Setor/mercado prioritário para o piloto"],
  ]],
  ["B", "Usuários, conteúdo e experiência", [
    ["7", "Usuário prioritário"],
    ["8", "O que é indispensável numa boa avaliação"],
    ["9", "Diferenças entre review de produto e de serviço"],
    ["10", "O que motiva avaliar sem induzir respostas"],
    ["11", "Moderação, denúncia e autenticidade"],
    ["12", "Valor de comunidade/colaboração entre usuários"],
  ]],
  ["C", "Gamificação, RA e ChatBot", [
    ["13", "Papel da gamificação"],
    ["14", "RA: essencial ou diferencial"],
    ["15", "Modelos 3D a partir de imagens: necessidade real?"],
    ["16", "Função do ChatBot"],
    ["17", "Pontos/badges/ranking e restrições éticas"],
  ]],
  ["D", "Dados, integração e tecnologia", [
    ["18", "Integrações (e-commerce, CRM, ERP, marketplace)"],
    ["19", "Dados utilizáveis / anonimização (LGPD)"],
    ["20", "Base de reviews históricos para teste"],
    ["21", "Plataforma prioritária (celular/desktop)"],
    ["22", "Indicadores de sucesso"],
  ]],
  ["E", "Encerramento", [
    ["23", "Disponibilidade para validar o protótipo depois"],
  ]],
];

const sinteseChildren = [
  title("Síntese da Entrevista — GR1"),
  boldLabel("Etapa: ", "5. Validação com a indústria — 02/10/2026 (\"Complementação da entrevista e consolidação das necessidades, restrições e expectativas\")."),
  boldLabel("Empresa/demanda: ", "Avanade do Brasil Ltda. — Jogo-Aplicativo Gamificado com RA e ChatBot para Reviews de Produtos e Serviços."),
  spacer(),
  banner("MODELO EM BRANCO. Preencher somente com o que a empresa realmente disse. Opinião ou interpretação do grupo vai na coluna \"Comentário do grupo\" ou na seção \"Pontos novos\", nunca misturada com a resposta."),

  h2("1. Dados da entrevista"),
  table([2600, 7106], ["Campo", "Registro"], [
    ["Data / horário", ""],
    ["Formato", `${BOX} Videochamada   ${BOX} Presencial   ${BOX} Resposta por escrito   ${BOX} Outro: ________`],
    ["Entrevistado(s) e cargo", ""],
    ["Intermediário (Dani CRI / unidade)", ""],
    ["Entrevistadores / anotador", ""],
    ["Gravação ou arquivo-fonte", "(link ou caminho do áudio, e-mail ou documento de respostas)"],
    ["Perguntas do roteiro cobertas", "____ de 23   (não respondidas: __________)"],
  ]),

  h2("2. Necessidades"),
  p("O que a empresa precisa que a solução resolva. Prioridade: A = essencial, M = importante, B = desejável."),
  table([500, 3400, 2700, 700, 2406], ["#", "Necessidade", "Evidência (trecho ou resposta)", "Prior.", "Pergunta de origem"],
    [1, 2, 3, 4, 5].map((n) => [String(n), "", "", "", ""])),

  h2("3. Restrições"),
  p("Limites que o protótipo e a futura solução precisam respeitar."),
  table([2000, 3900, 2200, 1606], ["Tipo", "Restrição", "Evidência", "Pergunta"], [
    ["Legal / LGPD", "", "", ""],
    ["Ética (pontos, recompensas, reviews comprados)", "", "", ""],
    ["Técnica / integração", "", "", ""],
    ["Dados disponíveis", "", "", ""],
    ["Negócio / marca", "", "", ""],
    ["Prazo / orçamento", "", "", ""],
    ["Outra: ________", "", "", ""],
  ]),

  h2("4. Expectativas"),
  p("O que a empresa espera ver no protótipo e como vai julgar se deu certo."),
  table([3000, 4000, 2706], ["Tema", "O que a empresa espera", "Evidência / pergunta"], [
    ["Resultado esperado do protótipo", "", ""],
    ["Indicadores de sucesso", "", ""],
    ["Papel esperado da gamificação", "", ""],
    ["Papel esperado de RA / 3D", "", ""],
    ["Papel esperado do ChatBot", "", ""],
    ["Próxima validação com a empresa", "", ""],
  ]),

  h2("5. Resposta a resposta (23 perguntas)"),
  p("Resumo curto da resposta real, ao lado da hipótese do grupo (ver Hipoteses_Respostas_Roteiro_GR1). Marque o veredito para alimentar a Matriz CSD."),
];

for (const [letra, nome, qs] of perguntasResumo) {
  sinteseChildren.push(new Paragraph({ spacing: { before: 200, after: 80 }, keepNext: true, children: [new TextRun({ text: `${letra}. ${nome}`, bold: true, size: 22, font: FONT, color: BLUE })] }));
  sinteseChildren.push(table([500, 2700, 4000, 1100, 1406], ["#", "Pergunta", "Resposta da empresa", "Veredito", "Comentário do grupo"],
    qs.map(([n, q]) => [n, q, "", `${BOX} C\n${BOX} P\n${BOX} E`, ""])));
}
sinteseChildren.push(p("Veredito: C = hipótese confirmada, P = parcialmente certa / precisa ajuste, E = errada.", { color: GRAY, italics: true }));

sinteseChildren.push(
  h2("6. Pontos novos e surpresas"),
  p("Informações que não estavam no roteiro nem nas hipóteses do grupo."),
  table([500, 5200, 4006], ["#", "O que a empresa disse", "Por que importa para o projeto"], [1, 2, 3].map((n) => [String(n), "", ""])),

  h2("7. Pontos em aberto e follow-up"),
  table([500, 4200, 2400, 2606], ["#", "O que ficou sem resposta", "Quem pergunta", "Prazo / canal"], [1, 2, 3].map((n) => [String(n), "", "", ""])),

  h2("8. Próximos passos"),
  bullet("Levar os vereditos e os pontos novos para a Matriz CSD atualizada (08/10/2026) — ver Matriz_CSD_Pre_Preenchida_GR1."),
  bullet("Enviar esta síntese ao docente e, se a empresa aceitar, devolver à Avanade para conferência."),
  bullet("Registrar datas e canais de cada contato com a empresa (Dani CRI, unidades, Avanade) para o pacote final."),
);

const sinteseDoc = new Document({ numbering, sections: [{ properties: portrait, children: sinteseChildren }] });

// ======================================================================
// 2) MATRIZ CSD PRÉ-PREENCHIDA (paisagem)
// ======================================================================
const WL = 15038; // largura útil paisagem

const certezas = [
  ["C1", "O problema-base é o baixo engajamento e a baixa qualidade/contextualização das avaliações de produtos e serviços no comércio digital.", "Demanda SENAI Saga", "Define o problema a validar na etapa 09/10."],
  ["C2", "A demanda pede jogo-aplicativo gamificado com RA, ChatBot e APIs, incluindo modelos 3D a partir de imagens.", "Demanda SENAI Saga", "Escopo declarado, mas a prioridade de cada recurso é suposição (ver S1, S2, S3)."],
  ["C3", "Benefícios esperados: engajamento, avaliações completas e confiáveis, informação via chatbot, experiência imersiva, comunidade, melhor decisão do consumidor, reputação das parceiras, uso em vários setores.", "Demanda SENAI Saga", "Base para os critérios de valor na matriz de decisão (22/10)."],
  ["C4", "A demanda não declara restrições formais.", "Demanda SENAI Saga", "Restrições reais (LGPD, ética, integração) podem surgir na entrevista."],
  ["C5", "Vigência de 13/11/2025 a 13/11/2026; demanda ativa.", "Demanda SENAI Saga", "Prazo da empresa coincide com o fim da 1ª fase."],
  ["C6", "A fase atual exige só protótipo de baixa/média fidelidade, sem software funcional.", "Orientação do programa", "Limita o escopo das ideias e do protótipo."],
  ["C7", "O usuário-tipo tem dificuldade de engajar com avaliações, vê reviews antigos ou só com estrelas, acha a ficha longa e chata, e tem dúvida se o produto vai agradar.", "Persona Adriana Lima e Mapa de Empatia", "Dores que a solução precisa tratar. Falta confirmar com usuários reais."],
].map(([id, t, o, i]) => [{ text: id, bold: true, fill: GREEN }, t, o, "Certa (fonte oficial)", i]);

const suposicoes = [
  ["S1", "RA é necessária (e não só diferencial opcional) para resolver o engajamento.", "14", "Parece diferencial/opcional; engajamento tem solução sem RA."],
  ["S2", "O ChatBot atua no apoio ao preenchimento do review e como assistente de informação do produto.", "16", "Função híbrida (orientar review + tirar dúvidas)."],
  ["S3", "Modelos 3D a partir de imagens são necessidade real, e não nice-to-have.", "15", "Não é prioridade 1; recurso avançado para categorias específicas."],
  ["S4", "Gamificação (pontos, badges, ranking) motiva reviews melhores sem enviesar as respostas.", "10, 13, 17", "Gamificação leve; sem troca de pontos por dinheiro nem nada que influencie a nota."],
  ["S5", "O usuário prioritário é o comprador final.", "7", "Comprador final (consumidor comum)."],
  ["S6", "A solução precisa funcionar em celular e desktop.", "21", "Celular como prioridade; desktop secundário."],
  ["S7", "Há necessidade de moderação e validação de autenticidade das avaliações.", "11", "Sim, provavelmente essencial (risco de fake review e spam)."],
  ["S8", "Comunidade/colaboração entre usuários (seguir, curtir) agrega valor.", "12", "Valor moderado/secundário; incremento futuro."],
].map(([id, t, q, h]) => [{ text: id, bold: true, fill: LIGHTYELLOW }, t, q, h, status, "", ""]);

const duvidas = [
  ["D1", "Qual é a dor prioritária: quantidade, qualidade ou confiabilidade das avaliações?", "1", "Combinação, com qualidade/contexto como dor mais forte."],
  ["D2", "Como o processo de review funciona hoje?", "2", "Formulário pós-compra (estrelas + texto opcional) por e-mail ou notificação."],
  ["D3", "Em que ponto o usuário abandona a avaliação?", "3", "Logo após a compra, sem contexto/incentivo; ou nem recebe convite."],
  ["D4", "Quais consequências o baixo engajamento gera para a empresa e o consumidor?", "4", "Decisões piores, perda de confiança, queda de conversão."],
  ["D5", "O que a empresa já tentou antes?", "5", "Cupons e e-mails de lembrete, sem sucesso relevante."],
  ["D6", "Qual setor/mercado deve ser o piloto?", "6", "E-commerce/varejo."],
  ["D7", "O que é indispensável numa avaliação de qualidade?", "8", "Nota + texto + contexto de uso; talvez foto/vídeo."],
  ["D8", "Reviews de produto e de serviço precisam de formatos diferentes?", "9", "Sim, campos diferentes."],
  ["D9", "Com quais sistemas (e-commerce, CRM, ERP) é preciso integrar?", "18", "E-commerce do cliente final; possivelmente CRM."],
  ["D10", "Quais dados podem ser usados e quais exigem anonimização (LGPD)?", "19", "Dados de compra e reviews sim; dados pessoais sensíveis não."],
  ["D11", "Existe base de reviews históricos para teste?", "20", "Provavelmente não há base pronta e anonimizada."],
  ["D12", "Quais indicadores definem sucesso?", "22", "Mais avaliações por pedido, mais completude, menos abandono."],
  ["D13", "A empresa estará disponível para validar o protótipo depois?", "23", "Provavelmente sim, sujeito à agenda do representante."],
].map(([id, t, q, h]) => [{ text: id, bold: true, fill: ORANGE }, t, q, h, `${BOX} Respondida\n${BOX} Segue em aberto`, "", ""]);

const matrizChildren = [
  title("Matriz CSD — GR1 (pré-preenchida)"),
  boldLabel("Etapa: ", "6. Matriz CSD — 08/10/2026 (\"Análise das informações obtidas e atualização da Matriz CSD\") e 09/10/2026 (\"Redefinição/validação do problema e dos requisitos iniciais\")."),
  boldLabel("Base: ", "CSD_Inicial_GR1 + Hipoteses_Respostas_Roteiro_GR1 + persona e mapa de empatia. A coluna \"Hipótese do grupo\" vem das hipóteses escritas antes da entrevista."),
  spacer(),
  banner("RASCUNHO PRÉ-ENTREVISTA. Nenhuma resposta da Avanade foi recebida até 02/10/2026. As colunas de hipótese são suposições do grupo, não fatos. Só marque o status e preencha \"Evidência\" quando houver resposta real da empresa (ou de usuários entrevistados)."),

  h2("Certezas"),
  p("Declaradas pela empresa, pelo programa ou pela persona. Se a entrevista contradizer alguma, mover para Dúvidas."),
  table([700, 6600, 2400, 1700, 3638], ["ID", "Certeza", "Origem", "Status", "Implicação para o projeto"], certezas),

  h2("Suposições (a validar)"),
  p("Escolhas do grupo ainda não confirmadas. Veredito: Confirmada vira Certeza; Parcial vira Certeza ajustada + nova Dúvida; Errada sai e gera ajuste de rota."),
  table([700, 4000, 900, 3000, 1800, 2900, 1738], ["ID", "Suposição", "Perg.", "Hipótese do grupo (pré-entrevista)", "Veredito", "Evidência / fonte real", "Novo status"], suposicoes),

  h2("Dúvidas (abertas)"),
  p("Só a entrevista ou a pesquisa com usuários resolve. Respondida: virar Certeza (ou Suposição ajustada). Em aberto: registrar o follow-up."),
  table([700, 4300, 900, 3000, 1900, 2900, 1338], ["ID", "Dúvida", "Perg.", "Hipótese do grupo (pré-entrevista)", "Situação", "Resposta / evidência", "Vira"], duvidas),

  h2("Novas descobertas (preencher após a entrevista)"),
  p("Itens que não estavam no CSD inicial. Classificar como Certeza, Suposição ou Dúvida."),
  table([700, 6600, 1700, 3000, 3038], ["ID", "Descoberta", "Classe", "Fonte (empresa, usuário, pesquisa)", "Impacto"],
    ["N1", "N2", "N3", "N4"].map((id) => [id, "", `${BOX} C  ${BOX} S  ${BOX} D`, "", ""])),

  h2("Problema e requisitos iniciais (rascunho para 09/10)"),
  p("Preencher depois de fechar a matriz. Uma frase de problema validado e os requisitos que sobreviveram."),
  table([3000, 12038], ["Item", "Redação"], [
    ["Problema validado (1 frase)", ""],
    ["Usuário prioritário", ""],
    ["Requisitos essenciais", ""],
    ["Requisitos desejáveis", ""],
    ["Restrições confirmadas", ""],
    ["O que fica fora do escopo da 1ª fase", ""],
  ]),

  h2("Plano B se a Avanade não responder até 08/10"),
  bullet("Rodar a matriz só com usuários reais do perfil da persona e pesquisa de concorrentes, mantendo as dúvidas de negócio (D5, D9 a D13) como \"em aberto\"."),
  bullet("Levar ao Prof. Paulo (09/10) o problema validado só pelo lado do usuário, deixando explícito o que depende da empresa."),
  bullet("Registrar no pacote final as datas e os canais de contato tentados com a Avanade e a Dani CRI."),
];

const matrizDoc = new Document({ numbering, sections: [{ properties: landscape, children: matrizChildren }] });

Packer.toBuffer(sinteseDoc)
  .then((b) => fs.writeFileSync("entregas/Sintese_Entrevista_Modelo_GR1.docx", b))
  .then(() => console.log("Sintese ok"));
Packer.toBuffer(matrizDoc)
  .then((b) => fs.writeFileSync("entregas/Matriz_CSD_Pre_Preenchida_GR1.docx", b))
  .then(() => console.log("Matriz ok"));
