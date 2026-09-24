const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, WidthType, BorderStyle, ShadingType,
  VerticalAlign, ImageRun, TabStopType, TabStopPosition,
} = require("docx");
const fs = require("fs");

const BLUE = "1F4E78";
const RED = "C00000";
const GRAY = "666666";
const LIGHTBLUE = "D9EAF7";
const FONT = "Arial";
const FONT_HEAD = "Arial";

const PAGE_WIDTH = 12240; // US Letter
const PAGE_HEIGHT = 15840;
const MARGIN_LR = 1000;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LR * 2; // 10240
const INDENT = 320;

const cellBorder = { style: BorderStyle.SINGLE, size: 2, color: "000000" };
const fullBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function blankAnswerLine() {
  return new Paragraph({
    indent: { left: INDENT },
    spacing: { after: 0 },
    children: [new TextRun({ text: "_".repeat(230), size: 18, font: FONT, color: "000000" })],
  });
}

function questionBlock(num, text, objetivo, isNew) {
  return [
    new Paragraph({
      spacing: { before: 140, after: 0 },
      children: [
        new TextRun({ text: `${num}. ${text}`, bold: true, size: 20, font: FONT, color: "000000" }),
        ...(isNew ? [new TextRun({ text: "  (nova)", italics: true, color: RED, size: 16, font: FONT })] : []),
      ],
    }),
    new Paragraph({
      indent: { left: INDENT },
      spacing: { after: 0 },
      children: [
        new TextRun({ text: "Objetivo da pergunta: ", bold: true, size: 17, font: FONT, color: GRAY }),
        new TextRun({ text: objetivo, size: 17, font: FONT, color: GRAY }),
      ],
    }),
    new Paragraph({
      indent: { left: INDENT },
      spacing: { after: 0 },
      children: [new TextRun({ text: "Registro da resposta: ", size: 18, font: FONT, color: "000000" })],
    }),
    blankAnswerLine(),
  ];
}

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 260, after: 140 },
    children: [new TextRun({ text, bold: true, color: RED, size: 24, font: FONT_HEAD })],
  });
}

function twoColTable(rows, valueMinLines) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [5115, 5115],
    borders: fullBorders,
    rows: rows.map(([label, value]) => {
      const valueParas =
        typeof value === "string"
          ? [new Paragraph({ children: [new TextRun({ text: value, size: 18, font: FONT, color: "000000" })] })]
          : Array.from({ length: valueMinLines || 1 }, () => new Paragraph({ children: [new TextRun({ text: " " })] }));
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 5115, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: LIGHTBLUE },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, font: FONT, color: BLUE })] })],
          }),
          new TableCell({
            width: { size: 5115, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: valueParas,
          }),
        ],
      });
    }),
  });
}

const logoBuffer = fs.readFileSync("senai_logo.png");

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: 1300, bottom: 1300, left: MARGIN_LR, right: MARGIN_LR, header: 700, footer: 700 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
              children: [
                new ImageRun({ data: logoBuffer, transformation: { width: 110, height: 24 }, type: "png" }),
                new TextRun({ text: "\tSENAI | Desafio de Ideias - Roteiros de Entrevista Exploratória", size: 16, font: FONT, color: GRAY }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Documento de apoio ao processo de Imersão e Validação da Demanda", size: 16, font: FONT, color: GRAY }),
              ],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 240, after: 200 },
          children: [new TextRun({ text: "ROTEIROS DE ENTREVISTAS EXPLORATÓRIAS", bold: true, size: 44, font: FONT, color: BLUE })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Desafio de Ideias - Roteiro de Entrevista Exploratória - GR1 (versão atualizada)", size: 20, font: FONT, color: "000000" }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [
            new TextRun({
              text:
                "Finalidade: apoiar o grupo na entrevista exploratória com a empresa responsável pela demanda, com perguntas específicas para esclarecer o problema, validar premissas, delimitar o escopo e definir critérios de sucesso para a solução. Versão revisada com 3 perguntas adicionais aprovadas pelo grupo em 24/09/2026.",
              size: 20, font: FONT, color: "000000",
            }),
          ],
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: "Docente responsável: Paulo Cesar de Camargo", size: 22, font: FONT })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: "Coordenação do curso: Marcos Alves", size: 22, font: FONT })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: "Coordenação pedagógica: Antônio Marcos", size: 22, font: FONT })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "Turma: 2IEDS | 2026", size: 22, font: FONT })] }),

        new Paragraph({
          spacing: { before: 100, after: 140 },
          children: [new TextRun({ text: "2. GR1 - Reviews Gamificados com RA e ChatBot", bold: true, color: BLUE, size: 30, font: FONT_HEAD })],
        }),
        twoColTable([
          ["Demanda", "Projeto Integrador 2025/02 1.34 08 - Desenvolvimento de Jogo-Aplicativo Gamificado com RA e ChatBot para Reviews de Produtos e Serviços"],
          ["Problema inicial identificado", "Baixo engajamento e baixa qualidade/contextualização das avaliações de produtos e serviços no comércio digital."],
          ["Ideia inicial do grupo", "Aplicativo gamificado com Realidade Aumentada, ChatBot, APIs e possibilidade de criação/uso de modelos 3D a partir de imagens."],
        ]),

        sectionHeading("A. Compreensão do problema e do processo atual"),
        ...questionBlock(1, "Qual é o principal problema que a empresa deseja resolver com esta demanda: baixa quantidade de avaliações, baixa qualidade dos comentários, baixa confiabilidade das avaliações ou outro ponto?", "Definir a dor principal."),
        ...questionBlock(2, "Como o processo de avaliação/review funciona hoje, desde o momento da compra ou uso do serviço até a publicação do feedback?", "Mapear a jornada atual."),
        ...questionBlock(3, "Em que momento os usuários normalmente abandonam ou deixam de realizar uma avaliação?", "Identificar o ponto crítico."),
        ...questionBlock(4, "Quais consequências o baixo engajamento em reviews gera para a empresa e para os consumidores?", "Entender impacto."),
        ...questionBlock(5, "A empresa já tentou alguma estratégia para aumentar o número ou a qualidade dos reviews? O que funcionou e o que não funcionou?", "Evitar repetir soluções ineficazes."),
        ...questionBlock(6, "Entre os setores onde a solução poderia ser aplicada (varejo, serviços, alimentação, tecnologia, entretenimento), existe algum que a Avanade queira usar como piloto ou prova de conceito?", "Delimitar o escopo do protótipo por setor prioritário.", true),

        sectionHeading("B. Usuários, conteúdo e experiência"),
        ...questionBlock(7, "Quem é o usuário prioritário da solução: comprador final, cliente recorrente, usuário de serviço, equipe interna ou mais de um perfil?", "Definir personas e perfis."),
        ...questionBlock(8, "Que tipo de informação a empresa considera indispensável em uma avaliação de qualidade?", "Converter expectativa em requisitos."),
        ...questionBlock(9, "Há diferenças importantes entre reviews de produtos e reviews de serviços que o sistema deve tratar?", "Validar fluxos distintos."),
        ...questionBlock(10, "O que poderia motivar o usuário a avaliar sem induzir respostas artificiais ou enviesadas?", "Validar gamificação."),
        ...questionBlock(11, "Existe necessidade de moderação, denúncia, bloqueio de conteúdo inadequado ou validação de autenticidade da avaliação?", "Levantar regras de negócio."),
        ...questionBlock(12, "Vocês veem valor em recursos de comunidade — como seguir outros avaliadores, curtir/responder reviews de terceiros ou criar rankings entre usuários — ou o foco deve ficar só na avaliação individual?", "Validar a hipótese de comunidade/colaboração entre usuários, citada como benefício esperado da demanda.", true),

        sectionHeading("C. Validação da ideia de gamificação, RA e ChatBot"),
        ...questionBlock(13, "Qual papel a gamificação deveria cumprir na visão da empresa: incentivar participação, orientar o preenchimento, gerar recompensas ou melhorar a experiência?", "Definir propósito."),
        ...questionBlock(14, "A empresa considera Realidade Aumentada essencial para a demanda ou seria um recurso opcional/diferencial? Em qual situação real ela agregaria valor?", "Testar hipótese de RA."),
        ...questionBlock(15, "A criação ou visualização de modelos 3D a partir de imagens é uma necessidade real do negócio? Quais objetos/produtos deveriam ser contemplados?", "Validar recurso 3D."),
        ...questionBlock(16, "Qual função o ChatBot deveria desempenhar: orientar o review, fazer perguntas complementares, responder dúvidas, resumir opiniões ou outra função?", "Delimitar ChatBot."),
        ...questionBlock(17, "A empresa imagina algum sistema de pontos, badges, ranking, cupons ou recompensas? Há restrições comerciais ou éticas para esse tipo de incentivo?", "Definir regras da gamificação."),

        sectionHeading("D. Dados, integração, privacidade e tecnologia"),
        ...questionBlock(18, "A solução deverá integrar-se a algum e-commerce, CRM, ERP, marketplace ou API existente? Quais sistemas são prioritários?", "Identificar integrações."),
        ...questionBlock(19, "Quais dados do usuário podem ser utilizados e quais devem ser evitados ou anonimizados?", "Levantar privacidade/LGPD."),
        ...questionBlock(20, "A empresa possui base de reviews históricos que possa ser utilizada para testes, de preferência anonimizada?", "Verificar dados de teste."),
        ...questionBlock(21, "A aplicação deverá funcionar prioritariamente em celular, navegador desktop ou ambos? Existem requisitos mínimos de dispositivo/câmera para RA?", "Definir plataforma."),
        ...questionBlock(22, "Quais indicadores demonstrariam sucesso: aumento da taxa de avaliações, maior completude, tempo de preenchimento, satisfação do usuário, conversão ou outros?", "Definir métricas."),

        sectionHeading("E. Encerramento e continuidade"),
        ...questionBlock(23, "Depois desta entrevista, teremos como voltar a validar o protótipo com vocês antes da entrega final? Quem seria o ponto de contato?", "Garantir canal de validação do protótipo de baixa/média fidelidade antes da entrega.", true),

        sectionHeading("Síntese pós-entrevista"),
        twoColTable(
          [
            ["Certezas confirmadas/novas", null],
            ["Suposições que foram validadas ou rejeitadas", null],
            ["Dúvidas que permaneceram", null],
            ["Alterações necessárias na ideia/protótipo", null],
          ],
          3
        ),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Roteiro_Entrevista_GR1_Atualizado.docx", buffer);
  console.log("done");
});
