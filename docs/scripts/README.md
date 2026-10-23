# Scripts do projeto

Execute os comandos a partir da raiz do repositório.

## Aplicação

| Comando | Finalidade |
| --- | --- |
| `npm.cmd run manager:create` | Cria um gestor no banco configurado pelas variáveis de ambiente. |
| `npm.cmd run demo` | Inicia a demonstração com dados sintéticos em memória na porta 3100. |

Os arquivos correspondentes ficam em `app/scripts/`. Execute os comandos npm dentro de `app/` ou use `npm.cmd --prefix app run demo` a partir da raiz.

## Documentos escolares

Os geradores ficam em `documents/`. Eles produzem arquivos em `docs/entregas/`, preservando a separação entre CTI e histórico Avanade.

| Script | Documento |
| --- | --- |
| `generate_matriz_csd_cti.js` | Matriz CSD da CTI |
| `generate_pesquisa_mercado.js` | Relatório de mercado em DOCX |
| `generate_pesquisa_mercado_pdf.py` | Conversão do relatório para PDF |
| `generate_roteiro.js` | Roteiro histórico Avanade |
| `generate_csd_hipoteses.js` | CSD e hipóteses históricas |
| `generate_sintese_matriz.js` | Síntese e matriz históricas |

Exemplo: `node docs/scripts/documents/generate_matriz_csd_cti.js`.
Os scripts JavaScript usam a dependência `docx` do projeto. O script Python depende de `python-docx`, `reportlab` e fontes Arial disponíveis no Windows. Rodar os geradores pode sobrescrever os entregáveis correspondentes.
