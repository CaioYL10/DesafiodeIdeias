# Aplicação da referência AvaliaPlay CTI — 22/10/2026

Referência consultada no navegador autenticado: https://www.figma.com/design/zyuYGp6uKAbtvYjrkgypDF/Untitled?node-id=0-1

## Implementado no código

- Navegação principal reaproveita os itens observados na tela original: Visão geral, Enviar feedback e Área do gestor. Contato e Portal do cliente não fazem parte da aplicação.
- Visitantes acessam a visão geral (`/`) e o formulário público (`/feedback`); Área do gestor leva a `/login`.
- Gestores autenticados veem os atalhos Dashboard e Cadastro de produtos e podem sair pela navegação.
- `/dashboard`, `/dashboard.html`, `/products` e `/products.html` são protegidos no servidor. A API de produtos também exige sessão. Links diretos para cadastro encaminham ao login e retornam ao cadastro após autenticação.
- Cadastro inicial de produtos e serviços com nome, tipo e descrição, armazenados em SQLite. A associação do catálogo cadastrado aos feedbacks ainda não foi implementada; o formulário continua usando as categorias de serviço do MVP.
- Base visual da referência aplicada: cabeçalho branco, faixa superior escura, azul CTI, painel inicial azul-claro, chamada principal e etapas de avaliação.
- Os indicadores do dashboard continuam calculados a partir do banco; a ilustração da página pública não apresenta dados privados nem métricas fictícias como se fossem reais.

## Para uma futura atualização do Figma

Reproduzir a navegação conforme o estado de autenticação, remover os dois botões antigos e a navegação inferior duplicada, separar visão geral de dashboard, e representar o retorno ao cadastro após login. As alterações desta etapa estão no código; os quadros do Figma não foram redesenhados.

O visual é uma adaptação da referência observada, não uma importação exata de todos os nove quadros. O formulário segue em uma página nesta etapa, preservando os controles de demonstração e o comentário obrigatório.
