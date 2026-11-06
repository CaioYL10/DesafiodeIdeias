# Desafio de Ideias — GR1 (SENAI)

Repositório de trabalho do GR1, turma 2IEDS (2026). A proposta atual é um CRM de experiência do cliente com gestão leve da qualidade para a CTI. **A proposta ainda não foi validada pela empresa.** Documentos escolares, especificações e registros anteriores permanecem em `docs/` e `config/`.

## Protótipo local AvaliaPlay CTI

O app em `app/` foi reconstruído a partir do [modelo do Figma](https://www.figma.com/design/cQdovwWJBVVa3t9SRsGTQ9/AvaliaPlay-CTI---Desafio-de-Ideias--c%C3%B3pia-?node-id=0-1) e adaptado para a proposta de CRM. Ele usa Node.js e HTML/CSS/JavaScript, sem dependências externas. Inclui visão geral interna, login demonstrativo, dashboard com as opções **Feedbacks** e **Relações**, consulta de feedbacks, clientes, perfil, mapa, triagem de reparação, acompanhamento de ações e serviços. O envio público de feedback foi retirado desta versão.

```powershell
cd app
npm.cmd start
```

Acesse `http://localhost:3000`. Sem sessão, a rota inicial mostra uma apresentação pública sem dados do CRM. Para entrar na gestão, abra o Login e informe um e-mail válido e uma senha qualquer. **Esse login é apenas visual e local; não protege dados reais.** Alterações feitas na interface ficam no `localStorage` do navegador e podem ser apagadas limpando os dados do site. A lista usa nomes de empresas exibidos no [site da CTI](https://www.cti.com.br/), sem inventar contatos, serviços contratados, reuniões ou localização para elas. Os feedbacks fictícios ficam vinculados a uma **Empresa de demonstração** separada da lista. Na triagem, uma regra local reúne pelo menos 10 feedbacks negativos de atendimento da mesma empresa; quando um motivo aparece em 60% deles, mostra uma sugestão. A equipe pode usar essa sugestão ou escrever uma proposta própria antes de decidir. **Não há IA real nesta demonstração.** Apenas propostas aceitas viram ações, cujo estado e histórico podem ser atualizados.

Execute `npm.cmd test` dentro de `app/` para testar as rotas e os recursos locais.

O protótipo **não substitui uma implementação de produção**: não há banco de dados, autenticação no servidor, integrações externas ou envio de comunicação. O plano funcional vigente está em [`docs/REFORMULACAO_CTI_CRM_SGQ.md`](docs/REFORMULACAO_CTI_CRM_SGQ.md).

## Materiais do projeto

- [`docs/contexto/`](docs/contexto/) — mudança de escopo e divisão de tarefas.
- [`docs/cronograma/`](docs/cronograma/) — cronograma da turma.
- [`docs/entregas/`](docs/entregas/) — entregáveis da CTI e histórico da Avanade.
- [`config/`](config/) — especificações e planos.
