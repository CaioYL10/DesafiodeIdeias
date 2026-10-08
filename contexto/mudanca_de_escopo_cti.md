# Mudança de escopo — da Avanade para a CTI (outubro/2026)

Registro da refatoração do projeto após a reunião com a equipe da empresa. Fontes: [`../fontes/Plano_de_Ensino_GR1_v2.docx`](../fontes/Plano_de_Ensino_GR1_v2.docx) (seções "Contextualização" e "Desafio"), site <https://www.cti.com.br/> (consultado em 08/10/2026) e o que o Caio relatou da reunião.

## A empresa: CTI

- Provedor de **internet corporativa**, **cloud** e **cibersegurança** para empresas. No mercado desde 1992 (mais de 34 anos), com foco em São Paulo e cidades próximas.
- Números do site: +2.500 empresas conectadas, +500 servidores virtuais gerenciados, +8.300 firewalls e endpoints gerenciados, 17 cidades com rede própria, 6 data centers no Brasil.
- Parcerias/certificações citadas: Fortinet, SonicWall (Gold), Ruckus, Microsoft, Acronis.
- Missão: "Entregar Internet de alta performance e tecnologias inteligentes para empresas que não podem parar". Valores incluem Excelência, Atendimento humano, Agilidade e Transparência.
- O site já usa **depoimentos de clientes** (suporte técnico, agilidade, parceria) como argumento comercial, e tem um Portal do Cliente (`myportal.cti.com.br`). Ou seja: a satisfação do cliente importa para a marca, mas o feedback é coletado de forma informal.
- **Cliente da CTI é empresa (B2B), não consumidor final.**

## O que a empresa realmente quer

Segundo o Caio: a CTI **ainda não tem um setor de análise de qualidade**. O que ela precisa é de um **sistema de armazenamento e análise de feedbacks** sobre os seus serviços, que gere informação útil para a gestão.

## Antes × depois

| Aspecto | Versão Avanade (até 02/10) | Versão CTI (a partir de 08/10) |
|---|---|---|
| Empresa | Avanade do Brasil | CTI |
| Demanda (título no Saga) | Jogo-Aplicativo Gamificado com RA e ChatBot para Reviews | Mesmo título oficial, mas o escopo foi refatorado |
| Problema | Consumidor não engaja em avaliar produtos e serviços | Empresa não tem estrutura para **receber, guardar e analisar** feedbacks dos seus serviços |
| Solução | Jogo-app com gamificação, RA e ChatBot | Sistema que recebe e armazena avaliações dos serviços e gera **relatórios para a gestão** |
| RA, ChatBot e IA | Núcleo da proposta | **ChatBot e IA excluídos**. RA não aparece mais |
| Gamificação | Núcleo da proposta | Fora do Desafio. Resta o termo "interativo" para a avaliação |
| Quem avalia | Consumidor de e-commerce (persona Adriana) | Clientes corporativos da CTI (a confirmar) |
| Quem consome o resultado | A empresa, de forma genérica | **Time de gestão** da CTI, via relatórios |

## Impacto nos entregáveis já feitos

| Entregável | Situação |
|---|---|
| Persona e Mapa de Empatia | Mantidos como evidência da imersão (o plano de ensino os mantém), mas a Adriana é consumidora de e-commerce e o cliente da CTI é B2B. **Revisar ou criar persona do gestor da CTI**. |
| Roteiro de entrevista (23 perguntas) | Montado para a Avanade, com seções inteiras sobre gamificação, RA e ChatBot. Fica como registro histórico. |
| CSD inicial, Hipóteses, Matriz CSD pré-preenchida, Síntese (modelo) | Idem: baseados na demanda antiga. A **Matriz CSD atualizada (08/10)** deve partir da CTI, com evidências da reunião. |

Nenhum desses arquivos foi alterado ou apagado. Os `.docx` são gerados por scripts em `scripts/`, então a versão CTI pode ser regenerada quando houver as respostas reais da reunião.

## Pontos em aberto (para o grupo/docente resolver)

1. **Plano de Ensino inconsistente.** A Contextualização exclui ChatBot e IA, mas a linha 3 do Plano de Aula ainda cita "RA e ChatBot conforme viabilidade". Pedir correção ao Prof. Paulo antes da assinatura.
2. **Protótipo × software funcional.** O Plano de Ensino fala em "protótipo funcional evolutivo" e em implementação Full Stack/APIs. O cronograma oficial diz que na 1ª fase **não será exigido software funcional**. Confirmar com o docente qual vale.
3. **Quem são os avaliadores?** Clientes corporativos da CTI (após um chamado de suporte, por exemplo)? Colaboradores internos? Os dois?
4. **O que é "serviço" a avaliar?** Internet, cloud, segurança, suporte técnico, atendimento comercial?
5. **Quais relatórios a gestão precisa?** (NPS/CSAT, tendência por serviço, nota por técnico, motivos de reclamação, tempo de resposta.)
6. **Onde o feedback entra hoje?** Portal do Cliente, telefone, e-mail, depoimentos? Há dados históricos?
7. **LGPD.** Feedback de cliente pode conter dado pessoal; definir anonimização e retenção.
8. **Papéis do grupo:** Caio (Product Owner), Isabella Dias da Silva (Scrum Master), demais integrantes Developers.
