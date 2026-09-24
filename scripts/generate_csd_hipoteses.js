const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign,
  HeadingLevel, convertInchesToTwip,
} = require("docx");
const fs = require("fs");

const BLUE = "1F4E78";
const RED = "C00000";
const GRAY = "666666";
const LIGHTBLUE = "D9EAF7";
const FONT = "Arial";

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

function title(text) {
  return new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text, bold: true, size: 40, font: FONT, color: BLUE })],
  });
}
function h2(text) {
  return new Paragraph({
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, size: 26, font: FONT, color: RED })],
  });
}
function h3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, font: FONT, color: BLUE })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 140 },
    children: [new TextRun({ text, size: 20, font: FONT, ...opts })],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullet-list", level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 20, font: FONT })],
  });
}
function boldLabel(label, rest) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: label, bold: true, size: 20, font: FONT }),
      new TextRun({ text: rest, size: 20, font: FONT }),
    ],
  });
}
function question(num, text) {
  return new Paragraph({
    spacing: { before: 220, after: 60 },
    children: [new TextRun({ text: `${num}. ${text}`, bold: true, size: 21, font: FONT, color: "000000" })],
  });
}
function answer(text) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: "Nossa hipótese: ", bold: true, size: 20, font: FONT, color: GRAY }),
      new TextRun({ text, size: 20, font: FONT, color: GRAY }),
    ],
  });
}

// ---------- CSD Inicial ----------

const csdDoc = new Document({
  numbering,
  sections: [
    {
      properties: { page: { margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 } } },
      children: [
        title("CSD Inicial — GR1 (Certezas, Suposições, Dúvidas)"),
        boldLabel("Etapa: ", "4. Preparação da entrevista — 25/09/2026 (\"Levantamento de certezas, suposições e dúvidas; preparação para contato com a indústria\")."),
        boldLabel("Empresa/demanda: ", "Avanade do Brasil Ltda. — Jogo-Aplicativo Gamificado com RA e ChatBot para Reviews de Produtos e Serviços."),
        boldLabel("Uso: ", "base para a entrevista exploratória com a Avanade (01–02/10/2026) e para a Matriz CSD que será atualizada depois dela (08–09/10/2026)."),

        h2("Certezas"),
        p("Coisas que já sabemos com confiança, porque estão declaradas pela própria empresa ou pelo programa — não precisam ser perguntadas na entrevista."),
        bullet("O problema-base é o baixo engajamento e a baixa qualidade/contextualização das avaliações de produtos e serviços no comércio digital."),
        bullet("A demanda pede um jogo-aplicativo gamificado, com Realidade Aumentada, ChatBot e APIs, incluindo a possibilidade de criação/uso de modelos 3D a partir de imagens."),
        bullet("Benefícios esperados pela empresa: mais engajamento, avaliações mais completas e confiáveis, acesso facilitado a informação via chatbot, experiências imersivas com RA, comunidade ativa/colaborativa, melhor tomada de decisão do consumidor, fortalecimento da reputação de empresas parceiras, e aplicabilidade a vários setores (varejo, serviços, alimentos, tecnologia, entretenimento)."),
        bullet("A demanda não possui restrições formais declaradas."),
        bullet("Vigência do projeto: 13/11/2025 a 13/11/2026 (12 meses), demanda ativa."),
        bullet("A fase atual (SENAI Saga) exige só protótipo de baixa/média fidelidade — não é preciso software funcional agora; isso só entraria se o projeto avançasse para o Inova SENAI."),
        bullet("Da persona (Adriana Lima) e do mapa de empatia: o usuário-tipo tem dificuldade de engajar com avaliações, vê sessões de avaliação antigas ou só com estrelas (sem texto), ouve reclamações de que a ficha de avaliação é longa e chata de preencher, e sente dúvida se o produto vai agradar antes de decidir a compra."),

        h2("Suposições"),
        p("Escolhas de solução que o grupo já fez na ideia inicial, mas que ainda não foram confirmadas pela empresa — são hipóteses que o roteiro de entrevista foi desenhado para testar."),
        bullet("Que a Realidade Aumentada é um recurso necessário (e não só um diferencial opcional) para resolver o problema de engajamento."),
        bullet("Que o ChatBot deve atuar tanto no apoio ao preenchimento do review quanto como assistente de informação do produto para o cliente."),
        bullet("Que modelos 3D a partir de imagens são uma necessidade real do negócio, e não um recurso de nice-to-have."),
        bullet("Que um sistema de gamificação (pontos, badges, ranking) motiva reviews de melhor qualidade sem enviesar as respostas."),
        bullet("Que o usuário prioritário é o comprador final (e não, por exemplo, cliente recorrente ou equipe interna da empresa)."),
        bullet("Que a solução precisa funcionar tanto em celular quanto em desktop."),
        bullet("Que existe necessidade de moderação e validação de autenticidade das avaliações."),
        bullet("Que recursos de comunidade/colaboração entre usuários (seguir avaliadores, curtir reviews) agregariam valor — ponto que o grupo decidiu incluir como pergunta nova no roteiro justamente por ser suposição, não certeza."),

        h2("Dúvidas"),
        p("Pontos em aberto que só a entrevista com a Avanade resolve. Agrupados pelas mesmas 5 seções do roteiro — ver Roteiro_Entrevista_GR1_Atualizado.docx para as 23 perguntas completas."),
        h3("Problema e processo atual"),
        p("Qual é a dor prioritária exata (quantidade x qualidade x confiabilidade das avaliações); como o processo de review funciona hoje; em que ponto o usuário abandona; o que a empresa já tentou antes; qual setor/mercado deve ser o piloto."),
        h3("Usuários e conteúdo"),
        p("Quem é de fato o usuário prioritário; o que a empresa considera indispensável numa avaliação de qualidade; diferenças entre reviews de produto e de serviço; o que motivaria avaliar sem induzir respostas artificiais; necessidade de moderação/denúncia."),
        h3("Gamificação, RA e ChatBot"),
        p("Qual o papel esperado da gamificação; se RA é essencial ou diferencial (e em que cenário agrega valor); se o recurso 3D é necessidade real; função exata do ChatBot; regras/restrições para pontos e recompensas."),
        h3("Dados, integração e tecnologia"),
        p("Com quais sistemas (e-commerce, CRM, ERP) a solução precisa integrar; quais dados podem ser usados (LGPD); se há base de reviews históricos para teste; plataforma prioritária (celular/desktop); quais indicadores definem sucesso."),
        h3("Encerramento"),
        p("Se a empresa vai estar disponível para uma nova rodada de validação do protótipo antes da entrega final."),
      ],
    },
  ],
});

// ---------- Hipóteses de resposta ----------

const perguntas = [
  ["A. Compreensão do problema e do processo atual", [
    ["1", "Qual é o principal problema: baixa quantidade, baixa qualidade, baixa confiabilidade, ou outro?",
      "provavelmente uma combinação — poucas avaliações e as que existem são rasas/sem contexto. A própria demanda já cita os dois (\"baixo engajamento e baixa qualidade/contextualização\"), então achamos que qualidade/contexto é a dor mais forte, não só quantidade."],
    ["2", "Como o processo de avaliação/review funciona hoje?",
      "um formulário padrão pós-compra (estrelas + campo de texto opcional), disparado por e-mail ou notificação, sem gamificação, com preenchimento opcional e de baixa fricção para pular."],
    ["3", "Em que momento os usuários abandonam a avaliação?",
      "logo após a compra, quando pedem para avaliar sem contexto ou incentivo — ou o cliente sequer chega a receber um convite proativo para avaliar."],
    ["4", "Quais consequências o baixo engajamento gera?",
      "decisões de compra piores para outros consumidores, perda de confiança na loja/marca, dificuldade da empresa em identificar problemas de produto a tempo, e possível queda de conversão."],
    ["5", "A empresa já tentou alguma estratégia antes?",
      "provavelmente cupons/descontos para quem avalia e e-mails de lembrete — sem sucesso significativo, o que motivou buscar o Desafio de Ideias."],
    ["6", "Setor/mercado prioritário para o piloto? (pergunta nova)",
      "e-commerce/varejo, por ser o setor mais citado no texto da própria demanda, embora a Avanade (consultoria de TI) atenda clientes de vários setores."],
  ]],
  ["B. Usuários, conteúdo e experiência", [
    ["7", "Quem é o usuário prioritário?",
      "o comprador final (consumidor comum), não um perfil B2B ou equipe interna — a demanda fala em \"reviews de produtos e serviços\" voltado ao público em geral."],
    ["8", "O que é indispensável numa avaliação de qualidade?",
      "nota + texto descritivo + contexto de uso (para que comprou, há quanto tempo usa); talvez foto/vídeo do produto em uso."],
    ["9", "Há diferenças entre reviews de produto e de serviço?",
      "sim — produto foca em qualidade física/durabilidade/entrega; serviço foca em atendimento, tempo de resposta e experiência subjetiva. Provavelmente exigem campos diferentes no formulário."],
    ["10", "O que motivaria avaliar sem induzir respostas artificiais?",
      "gamificação leve (pontos, progresso, badges) e reduzir a fricção do processo (poucos cliques, mobile-first) — não recompensa financeira direta, que enviesaria a nota."],
    ["11", "Existe necessidade de moderação/denúncia/validação de autenticidade?",
      "sim, provavelmente essencial — é uma plataforma de reviews públicos, com risco real de fake reviews e spam."],
    ["12", "Vocês veem valor em recursos de comunidade/colaboração entre usuários? (pergunta nova)",
      "valor moderado/secundário — a empresa provavelmente prioriza as funcionalidades centrais de review primeiro, e trata comunidade como incremento futuro."],
  ]],
  ["C. Validação da ideia de gamificação, RA e ChatBot", [
    ["13", "Qual papel a gamificação deveria cumprir?",
      "principalmente incentivar participação e tornar o ato de avaliar menos \"tarefa chata\" — não necessariamente gerar recompensa financeira."],
    ["14", "RA é essencial ou um diferencial opcional?",
      "diferencial/opcional, não essencial — o problema central (engajamento) provavelmente pode ser resolvido sem RA; ela funcionaria mais como diferencial de inovação/marketing."],
    ["15", "Modelos 3D a partir de imagens são necessidade real?",
      "não é prioridade número 1 — mais um recurso avançado para categorias específicas (moda, decoração, eletrônicos), a ser testado depois do core do produto."],
    ["16", "Qual função o ChatBot deveria desempenhar?",
      "função híbrida — orientar o preenchimento do review e responder dúvidas gerais do cliente sobre o produto, antes ou depois da compra."],
    ["17", "Há sistema de pontos/badges/ranking? Restrições éticas?",
      "sim, algum sistema de pontos/níveis, mas com restrição clara contra trocar pontos por dinheiro direto ou qualquer coisa que possa influenciar a nota dada (compliance de \"review comprado\")."],
  ]],
  ["D. Dados, integração, privacidade e tecnologia", [
    ["18", "Precisa integrar com e-commerce/CRM/ERP/marketplace?",
      "sim, provavelmente com a plataforma de e-commerce do cliente final da Avanade, e possivelmente CRM para histórico de compra do usuário."],
    ["19", "Quais dados podem ser usados/devem ser anonimizados?",
      "dados de compra (produto, data) e histórico de reviews podem ser usados; dados pessoais sensíveis (CPF, endereço) devem ser evitados ou anonimizados por LGPD."],
    ["20", "Existe base de reviews históricos disponível para teste?",
      "provavelmente não uma base pronta e já anonimizada — como a Avanade é consultoria, os dados reais pertenceriam a um cliente final dela, o que pode complicar o acesso."],
    ["21", "Plataforma prioritária: celular, desktop ou ambos?",
      "celular como prioridade — a maior parte das compras e reviews em e-commerce hoje acontece via app/mobile — com desktop como secundário."],
    ["22", "Quais indicadores demonstrariam sucesso?",
      "aumento da taxa de avaliações por pedido, maior completude (mais texto/detalhe por review) e redução do abandono no meio do formulário."],
  ]],
  ["E. Encerramento e continuidade", [
    ["23", "A empresa estará disponível para validar o protótipo depois? (pergunta nova)",
      "provavelmente sim — é uma demanda cadastrada formalmente no SENAI Saga com vigência de 12 meses, o que sugere disposição da Avanade para acompanhar o processo, mas pode depender de agenda do representante."],
  ]],
];

const hipotesesChildren = [
  title("Hipóteses de resposta — Roteiro de Entrevista GR1"),
  boldLabel("Para quê serve este documento: ", "antes da entrevista com a Avanade (01–02/10/2026), o grupo registrou aqui a resposta que acha mais provável para cada uma das 23 perguntas do roteiro de entrevista (Roteiro_Entrevista_GR1_Atualizado.docx). Depois da entrevista real, comparar cada hipótese com a resposta verdadeira da empresa e marcar: confirmada, parcialmente certa, ou errada — isso vira insumo direto para a Matriz CSD atualizada (08–09/10/2026)."),
  boldLabel("Importante: ", "estas são suposições do grupo, não fatos — construídas em cima da descrição da demanda, da persona (Adriana Lima) e do mapa de empatia. Não usar como se fossem respostas confirmadas."),
];

for (const [heading, qs] of perguntas) {
  hipotesesChildren.push(h2(heading));
  for (const [num, text, hip] of qs) {
    hipotesesChildren.push(question(num, text));
    hipotesesChildren.push(answer(hip));
  }
}

hipotesesChildren.push(h2("Como usar depois da entrevista"));
hipotesesChildren.push(p("Para cada pergunta, comparar a resposta real com a hipótese acima e marcar:"));
hipotesesChildren.push(
  new Table({
    width: { size: 8000, type: WidthType.DXA },
    columnWidths: [2500, 5500],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
    },
    rows: [
      ["Símbolo", "Significado"],
      ["CONFIRMADA", "Hipótese confirmada"],
      ["PARCIAL", "Parcialmente certa / precisa ajuste"],
      ["ERRADA", "Hipótese errada"],
    ].map((cells, i) =>
      new TableRow({
        children: cells.map(
          (t) =>
            new TableCell({
              shading: i === 0 ? { type: ShadingType.CLEAR, fill: LIGHTBLUE } : undefined,
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: t, bold: i === 0, size: 20, font: FONT, color: i === 0 ? BLUE : "000000" })] })],
            })
        ),
      })
    ),
  })
);
hipotesesChildren.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "O resultado alimenta diretamente a \"Síntese pós-entrevista\" do roteiro e a Matriz CSD atualizada da etapa seguinte (08–09/10/2026).", size: 20, font: FONT })] }));

const hipotesesDoc = new Document({
  numbering,
  sections: [
    {
      properties: { page: { margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 } } },
      children: hipotesesChildren,
    },
  ],
});

Packer.toBuffer(csdDoc).then((buffer) => fs.writeFileSync("entregas/CSD_Inicial_GR1.docx", buffer)).then(() => console.log("CSD ok"));
Packer.toBuffer(hipotesesDoc).then((buffer) => fs.writeFileSync("entregas/Hipoteses_Respostas_Roteiro_GR1.docx", buffer)).then(() => console.log("Hipoteses ok"));
