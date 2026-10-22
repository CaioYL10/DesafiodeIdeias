const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  PageNumber, Footer, Header
} = require('docx');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'entregas', 'cti', 'analise_mercado', 'Pesquisa_Analise_Mercado_Feedback_CTI_GR1.docx');
const navy = '17365D';
const teal = '0F6B78';
const lightBlue = 'EAF1F7';
const gray = '5B6573';
const border = { style: BorderStyle.SINGLE, size: 4, color: 'C7D2DE' };
const tableBorders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

function run(text, options = {}) { return new TextRun({ text, font: 'Arial', size: 21, color: '202833', ...options }); }
function para(text, options = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 130, line: 280 },
    children: [run(text)],
    ...options,
  });
}
function richPara(parts, options = {}) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 130, line: 280 }, children: parts.map(p => typeof p === 'string' ? run(p) : run(p.text, p.options || {})), ...options });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 70, line: 260 }, children: [run(text)] });
}
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, keepNext: true, spacing: { before: level === HeadingLevel.HEADING_1 ? 280 : 180, after: 100 }, children: [run(text, { bold: true, color: '000000', size: level === HeadingLevel.HEADING_1 ? 26 : 23 })] });
}
function cell(text, { header = false, width = 1.5 } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: header ? { type: ShadingType.CLEAR, fill: navy } : undefined,
    margins: { top: 90, bottom: 90, left: 100, right: 100 },
    children: [new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 0, line: 230 }, children: [run(text, { size: 18, bold: header, color: header ? 'FFFFFF' : '202833' })] })],
  });
}
function row(items, header = false) { return new TableRow({ tableHeader: header, children: items.map((t, i) => cell(t, { header, width: [1800, 4104, 3456][i] })) }); }
function linkRef(text, url) {
  return new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 100, line: 250 }, indent: { left: 360, hanging: 360 }, children: [run(text + ' Disponível em: '), new TextRun({ text: url, font: 'Arial', size: 18, color: teal, underline: { color: teal } }), run('. Acesso em: 22 out. 2026.', { size: 18 })] });
}

const children = [];
children.push(new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 70 }, children: [run('Pesquisa e análise de mercado', { bold: true, size: 34, color: '000000' })] }));
children.push(new Paragraph({ spacing: { after: 180 }, children: [run('Sistema de coleta e análise de feedback para serviços B2B', { size: 24, color: teal })] }));
children.push(new Paragraph({ spacing: { after: 210 }, children: [run('Desafio de Ideias | GR1 | CTI | 22 de outubro de 2026', { size: 19, color: gray })] }));
children.push(heading('1. Sinais do mercado brasileiro')); 
children.push(para('A TIC Empresas 2025, divulgada pelo Cetic.br/NIC.br em 2026, entrevistou 4.174 empresas com dez ou mais pessoas ocupadas, entre fevereiro de 2025 e janeiro de 2026. No total, 31% das empresas declararam usar CRM em 2025, ante 25% em 2024. Na região Sudeste, o indicador passou de 24% para 32%. O dado aponta avanço de ferramentas digitais de relacionamento com clientes, mas CRM não é sinônimo de plataforma de voz do cliente e o indicador não mede uso de pesquisas de satisfação (NIC.br, 2026).'));
children.push(para('Na mesma pesquisa, 54% das empresas pagaram por armazenamento de arquivos ou banco de dados em nuvem, 45% por software de segurança e 36% por capacidade de processamento em nuvem. No setor de informação e comunicação, os percentuais foram 72%, 63% e 57%, respectivamente. Esse recorte setorial é um sinal de familiaridade com serviços digitais em um setor próximo ao da CTI; não deve ser interpretado como demanda comprovada por um sistema de feedback (CETIC.br, 2026).'));
children.push(para('Outros sinais ajudam a entender o ambiente de uso: 79% das empresas utilizaram WhatsApp ou Telegram para negócios em 2025, comparado a 74% em 2024; 93% tinham conexão por fibra óptica. Isso torna plausível investigar canais digitais leves para enviar uma pesquisa, mas a escolha do canal precisa refletir os processos e as preferências dos clientes da CTI, ainda não documentados no repositório (NIC.br, 2026).'));
children.push(heading('2. Concorrentes e soluções adjacentes'));
children.push(para('A comparação abaixo observa funções descritas nas páginas oficiais consultadas. Ela organiza o espaço de soluções, mas não compara preços, desempenho, segurança, implantação ou adequação contratual, que exigiriam demonstrações, propostas e critérios equivalentes.'));
children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [1800, 4104, 3456], borders: tableBorders, rows: [
  row(['Solução', 'Capacidades públicas observadas', 'Leitura para o projeto'], true),
  row(['Track.co', 'Pesquisas multimétricas, relatórios, regras de recorrência e acompanhamento de tratativas (TRACK.CO, [s.d.]).', 'Referência para ciclo de pesquisa, relatório e retorno ao cliente.']),
  row(['SoluCX', 'Pesquisas em vários canais, métricas NPS, CSAT e CES, dashboards e tratamento de reclamações (SOLUCX, [s.d.]).', 'Exemplo de plataforma especializada em experiência do cliente.']),
  row(['Zendesk', 'Avaliação CSAT ligada a chamados resolvidos, com nota positiva ou negativa e comentário opcional (ZENDESK, [s.d.]).', 'Exemplo de pesquisa integrada ao fluxo de atendimento.']),
  row(['HubSpot', 'Pesquisas CSAT por e-mail, chat ou página web, com perguntas de acompanhamento por tipo de resposta (HUBSPOT, 2026).', 'Referência para canais digitais e perguntas condicionais.']),
] }));
children.push(para('A leitura competitiva sugere dois grupos principais. Plataformas especializadas de experiência do cliente oferecem pesquisas, métricas, painéis e fluxos de acompanhamento em conjunto. Suites de CRM ou atendimento incorporam pesquisas ao ciclo de chamados e aos dados de relacionamento. Formulários genéricos, planilhas e registros manuais podem funcionar como substitutos de baixo custo, embora não tenham sido comparados em funcionalidades nem validados como práticas atuais da CTI. Assim, o espaço possível para o MVP é ser simples e focado no processo que a empresa confirmar, sem pressupor que precise substituir CRM, portal ou ferramenta de suporte.'));
children.push(heading('3. Oportunidade e implicações para o MVP'));
children.push(para('A oportunidade não está em afirmar que inexiste concorrência, mas em testar se a CTI precisa de uma forma mais organizada de transformar avaliações dispersas em acompanhamento e informação gerencial. O diferencial a investigar é a aderência ao contexto de serviços corporativos recorrentes: relacionar cada feedback ao serviço e à interação correta, encontrar padrões ao longo do tempo e sinalizar avaliações que demandem retorno. A necessidade de cada função deve ser confirmada com a empresa.'));
children.push(para('Como hipótese para delimitar o MVP, o fluxo poderia registrar uma avaliação curta, associar serviço e data ou interação, armazenar uma nota e comentário opcional, exibir uma visão gerencial com filtros básicos e permitir acompanhar o status de retorno. O fluxo prioriza captura, organização e uso da informação. Não pressupõe chatbot, inteligência artificial, integração externa, cálculo de NPS ou acesso de clientes ao painel. Esses itens só devem ser incluídos se houver evidência de necessidade, tempo e viabilidade.'));
children.push(para('As práticas descritas pelos fornecedores apontam para pesquisas rápidas e vinculadas a uma experiência específica. Zendesk exemplifica avaliação breve após a resolução de um chamado; HubSpot descreve questionários ligados a interações e perguntas de acompanhamento conforme a resposta. Isso oferece referências de desenho, não uma especificação para a CTI. Para o protótipo e o MVP, uma pergunta de satisfação, uma pergunta opcional de motivo e contexto mínimo podem reduzir esforço de resposta, sujeito à validação com usuários (ZENDESK, [s.d.]; HUBSPOT, 2026).'));
children.push(heading('4. Indicadores que podem ser avaliados'));
children.push(bullet('Volume de respostas recebidas por período e serviço, para mostrar a quantidade de feedback registrado.'));
children.push(bullet('Satisfação por serviço e período, usando uma escala simples definida e explicada no produto.'));
children.push(bullet('Distribuição de respostas e evolução ao longo do tempo, sem definir metas antes de conhecer uma linha de base.'));
children.push(bullet('Motivos mencionados nos comentários, inicialmente por leitura e classificação manual, sem prometer análise automatizada.'));
children.push(bullet('Feedbacks negativos aguardando retorno e situação do acompanhamento, caso a CTI confirme que essa tratativa faz parte do processo.'));
children.push(para('NPS, CSAT e CES são métricas utilizadas em soluções comerciais consultadas, mas medem perguntas e conceitos diferentes. O grupo não deve escolher uma delas apenas por ser comum no mercado. Primeiro deve perguntar que decisão a gestão quer tomar e qual pergunta de avaliação é compreensível para os clientes da CTI (SOLUCX, [s.d.]; TRACK.CO, [s.d.]).'));
children.push(heading('5. Proteção de dados e riscos de adoção'));
children.push(para('Feedback pode conter dados pessoais de contatos corporativos, inclusive em comentários livres. A LGPD define princípios como finalidade, adequação, necessidade, transparência e segurança; seu texto também prevê que o titular seja informado sobre finalidade, forma e duração do tratamento, identificação e contato do controlador, compartilhamento e direitos. Para o MVP, isso recomenda coletar apenas o necessário, explicar o uso dos dados, restringir acesso, definir retenção com a CTI e preferir visões agregadas quando a identificação individual não for necessária (BRASIL, 2018).'));
children.push(para('Os principais riscos de produto são baixa taxa de resposta, avaliações concentradas em momentos extremos, falta de contexto para interpretar a nota, ausência de responsável por tratar comentários críticos e indicadores confundidos com metas. Reduzir fricção, associar cada resposta a um contexto claro e validar quem usará os relatórios são decisões de descoberta. Não há evidência pública consultada que permita estimar a taxa de resposta esperada dos clientes da CTI.'));
children.push(heading('6. Síntese para a equipe'));
children.push(richPara([{ text: 'Mensagem central para a análise: ', options: { bold: true, color: navy } }, 'o mercado já oferece plataformas especializadas e suites de atendimento que coletam e organizam avaliações; os dados oficiais mostram digitalização crescente das empresas brasileiras. A pesquisa justifica investigar uma solução de feedback para a CTI, mas não estima o tamanho do mercado nem comprova a demanda específica da empresa. O MVP deve validar um fluxo pequeno de coleta, organização, visualização e acompanhamento, guiado pelas respostas da CTI.']));
children.push(heading('Limitações da pesquisa'));
children.push(para('Esta análise é baseada em fontes secundárias. Não inclui entrevista adicional com a CTI, pesquisa com clientes da empresa, teste de produtos concorrentes, comparação de preços, avaliação de contratos ou dimensionamento de mercado. As descrições de Track.co, SoluCX, Zendesk e HubSpot são autodeclaradas em páginas oficiais. Os dados TIC Empresas cobrem organizações com dez ou mais pessoas ocupadas e servem como contexto de digitalização, não como medida de demanda por gestão de feedback.'));
children.push(heading('Referências'));
children.push(linkRef('BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais.', 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm'));
children.push(linkRef('CETIC.BR. TIC Empresas 2025: B18, empresas que pagaram por serviços em nuvem. Tabelas de indicadores.', 'https://cetic.br/pt/tics/pesquisa/2025/empresas/B18/expandido/'));
children.push(linkRef('HUBSPOT. Create and conduct customer satisfaction surveys. Atualizado em 20 jun. 2026.', 'https://knowledge.hubspot.com/customer-feedback/create-and-send-customer-satisfaction-surveys'));
children.push(linkRef('NIC.BR. Uso de Inteligência Artificial por empresas brasileiras avança e atinge 17%, aponta pesquisa do Cetic.br. 15 jun. 2026.', 'https://cetic.br/pt/noticia/uso-de-inteligencia-artificial-por-empresas-brasileiras-avanca-e-atinge-17-aponta-pesquisa-do-cetic-br/'));
children.push(linkRef('SOLUCX. SoluCX Platform.', 'https://solucx.com.br/platform/'));
children.push(linkRef('TRACK.CO. Plataforma de gestão de experiência do cliente.', 'https://track.co/'));
children.push(linkRef('ZENDESK. CSAT resources.', 'https://support.zendesk.com/hc/en-us/articles/4416863344026-CSAT-resources'));

const doc = new Document({
  numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: 'bullet', text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 180 } } } }] }] },
  styles: {
    default: { document: { run: { font: 'Arial', size: 21, color: '202833' }, paragraph: { spacing: { after: 130, line: 280 } } } },
    title: { run: { font: 'Arial', size: 34, bold: true, color: '000000' }, paragraph: { spacing: { after: 70 } } },
    heading1: { run: { font: 'Arial', size: 26, bold: true, color: '000000' }, paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 0 } },
    heading2: { run: { font: 'Arial', size: 23, bold: true, color: '000000' }, paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 } },
  },
  sections: [{
    properties: { page: { margin: { top: 1100, right: 1150, bottom: 1100, left: 1150 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D7E0E8', space: 6 } }, children: [run('DESAFIO DE IDEIAS  |  GR1  |  CTI', { size: 16, color: gray })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Pesquisa de mercado  •  22 out. 2026  •  ', { size: 16, color: gray }), new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: gray })] })] }) },
    children,
  }],
});
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
Packer.toBuffer(doc).then(buffer => { fs.writeFileSync(outputPath, buffer); console.log(outputPath); }).catch(error => { console.error(error); process.exit(1); });


