# Evolução de escopo — Avanade → CTI → CRM + SGQ leve (outubro/2026)

Registro da refatoração do projeto após a reunião com a equipe da empresa. Fontes: [`../fontes/Plano_de_Ensino_GR1_v2.docx`](../fontes/Plano_de_Ensino_GR1_v2.docx) (seções "Contextualização" e "Desafio"), site <https://www.cti.com.br/> (consultado em 08/10/2026) e o que o Caio relatou da reunião.

## A empresa: CTI

- Provedor de **internet corporativa**, **cloud** e **cibersegurança** para empresas. No mercado desde 1992 (mais de 34 anos), com foco em São Paulo e cidades próximas.
- Números do site: +2.500 empresas conectadas, +500 servidores virtuais gerenciados, +8.300 firewalls e endpoints gerenciados, 17 cidades com rede própria, 6 data centers no Brasil.
- Parcerias/certificações citadas: Fortinet, SonicWall (Gold), Ruckus, Microsoft, Acronis.
- Missão: "Entregar Internet de alta performance e tecnologias inteligentes para empresas que não podem parar". Valores incluem Excelência, Atendimento humano, Agilidade e Transparência.
- O site já usa **depoimentos de clientes** (suporte técnico, agilidade, parceria) como argumento comercial, e tem um Portal do Cliente (`myportal.cti.com.br`). Ou seja: a satisfação do cliente importa para a marca, mas o feedback é coletado de forma informal.
- **Cliente da CTI é empresa (B2B), não consumidor final.**

## Necessidade relatada pela CTI em 08/10

Segundo o Caio, na reunião de 08/10, a CTI **não possui um setor dedicado à análise da qualidade**. A demanda identificada pelo grupo nessa etapa era receber, armazenar e analisar feedbacks sobre os serviços, gerando informação útil para a gestão. As respostas detalhadas da reunião ainda não foram transcritas no repositório; não completar lacunas com suposições.

## Antes × depois

| Aspecto | Versão Avanade (até 02/10) | CTI inicial (08/10) | Proposta atual do grupo (22/10) |
|---|---|---|---|
| Empresa | Avanade do Brasil | CTI | CTI |
| Demanda (título no Saga) | Jogo-Aplicativo Gamificado com RA e ChatBot para Reviews | Mesmo título oficial, com escopo refatorado | A proposta do grupo parte da necessidade CTI e acrescenta um fluxo leve de qualidade |
| Problema | Consumidor não engaja em avaliar produtos e serviços | Empresa precisa receber, guardar e analisar feedbacks dos serviços | Grupo propõe relacionar histórico de clientes e feedbacks a problemas e ações de melhoria |
| Solução | Jogo-app com gamificação, RA e ChatBot | Sistema de feedbacks com relatórios para gestão | CRM focado na experiência + gestão leve da qualidade, com triagem humana e acompanhamento da eficácia |
| RA, ChatBot e IA | Núcleo da proposta | ChatBot e IA foram excluídos da proposta CTI inicial; RA não aparece mais | Chatbot segue fora; IA é proposta apenas para sugerir sentimento positivo, neutro ou negativo, com revisão humana |
| Gamificação | Núcleo da proposta | Fora do núcleo da solução | Fora do escopo |
| Quem registra/avalia | Consumidor de e-commerce (persona Adriana) | Clientes corporativos da CTI, a confirmar | Canal e papéis ainda precisam ser validados com a CTI |
| Quem consome o resultado | A empresa, de forma genérica | Time de gestão da CTI, via relatórios | Gestão e equipe responsável pela triagem e pelas ações, a confirmar |

## Proposta atual definida por Caio para o GR1 (22/10)

Caio, como Product Owner do GR1, decidiu adotar como **hipótese de solução**, ainda não validada pela CTI, evoluir a ferramenta de feedback para um CRM focado no relacionamento com clientes, integrado a uma gestão leve da qualidade. O motivo é investigar uma forma estruturada de acompanhar os relatos e as melhorias quando não há um setor dedicado à análise da qualidade; essa informação, sozinha, não comprova quais processos a empresa precisa.

O recorte proposto inclui cadastro básico de clientes e serviços, histórico de interações e feedbacks, triagem humana, registro de problemas de qualidade, ações com responsáveis e prazos, verificação de eficácia e indicadores gerenciais. A IA apenas sugere sentimento positivo, neutro ou negativo; a equipe pode revisar a classe e decide se o relato gera caso de qualidade. A IA não identifica causas nem cria ações automaticamente.

Chatbot, CRM comercial amplo e SGQ completo ficam fora. “Problema de qualidade” é o termo provisório; o uso formal de “não conformidade” e os critérios para abrir e encerrar casos dependem do processo real da CTI. Ver a [especificação vigente](../../config/superpowers/specs/2026-10-22-crm-sgq-leve-cti-design.md).

## Impacto nos entregáveis já feitos

| Entregável | Situação |
|---|---|
| Persona e Mapa de Empatia | Mantidos como evidência da imersão (o plano de ensino os mantém), mas a Adriana é consumidora de e-commerce e o cliente da CTI é B2B. **Revisar ou criar personas de cliente corporativo e de quem acompanha qualidade/relacionamento** após validar papéis. |
| Roteiro de entrevista (23 perguntas) | Montado para a Avanade, com seções inteiras sobre gamificação, RA e ChatBot. Fica como registro histórico. |
| CSD inicial, Hipóteses, Matriz CSD pré-preenchida, Síntese (modelo) | Materiais da Avanade ficam como histórico. A Matriz CSD da CTI (08/10) ainda contém suposições e precisa ganhar evidências da reunião e dúvidas sobre CRM, qualidade e IA. |

Nenhum desses arquivos foi alterado ou apagado. Os `.docx` são gerados por scripts em `scripts/`, então a versão CTI pode ser regenerada quando houver as respostas reais da reunião.

## Pontos em aberto (para o grupo/docente resolver)

1. **Proposta do grupo × Plano de Ensino.** O Plano de Ensino v2/v3 descreve a refatoração CTI e exclui IA da solução original, enquanto a proposta do grupo de 22/10 adiciona IA somente para classificação de sentimento. Confirmar com o Prof. Paulo se esse acréscimo cabe nos entregáveis e se exige atualização documental. Chatbot e RA continuam fora da proposta atual.
2. **MVP funcional × cronograma oficial.** Em 22/10/2026, Caio informou que o professor solicitou que o GR1 avance para um MVP funcional, além da prototipação de baixa fidelidade. Isso é coerente com o Plano de Ensino v3, que prevê desenvolvimento Full Stack/APIs conforme viabilidade, testes e demonstração funcional. O cronograma oficial recebido em 08/10 ainda diz que software funcional não será exigido em 13/11. A orientação mais recente do professor guia o trabalho do grupo; a divergência formal dos documentos segue pendente de atualização.
3. **Validação da hipótese CRM + SGQ leve.** A CTI reconhece o problema de acompanhamento integrado de clientes, feedbacks e melhorias? Como o trabalho é feito hoje?
4. **Papéis e usuários.** Quem registra feedback, faz triagem, aprova ações e acompanha eficácia? Clientes corporativos, contatos dos clientes, colaboradores internos ou todos podem interagir com o sistema?
5. **Serviços e canais.** O que pode ser associado ao feedback (internet, cloud, cibersegurança, suporte etc.)? O relato vem do Portal do Cliente, telefone, e-mail ou outro canal? Há dados históricos?
6. **Qualidade.** Como a CTI define reclamação, incidente, problema de qualidade e não conformidade? Quais etapas, responsáveis, prazos e evidências usa para tratar e encerrar?
7. **Indicadores.** Quais relatórios ajudam a gestão? Sentimento não substitui métricas formais como CSAT/NPS; perguntar se estas são necessárias e como devem ser medidas.
8. **Uso de IA e dados.** A CTI aceita análise automática de sentimento? Que ferramenta, revisão, retenção e autorização seriam necessárias? Não enviar dados reais a provedores externos antes de validar isso.
9. **Privacidade e acesso.** Definir quais dados pessoais ou confidenciais são necessários, quem pode acessá-los e por quanto tempo devem ser mantidos.
10. **Viabilidade do MVP.** Qual fatia do fluxo cabe no prazo escolar e como compatibilizar a proposta com o Plano de Ensino?
11. **Papéis do grupo:** Caio (Product Owner), Isabella Dias da Silva (Scrum Master), demais integrantes Developers.
