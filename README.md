# POC de Automação Cypress dirigida por Planilha

Prova de conceito de automação de testes web onde o cliente final define os cenários de teste em uma planilha Excel e executa a suíte através de uma interface web, sem escrever código.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Cypress](https://img.shields.io/badge/Cypress-15.x-brightgreen)](https://cypress.io)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://python.org)

## Sobre o projeto

Automatizar testes de fluxo web tradicionalmente exige um desenvolvedor. Esta POC inverte esse modelo: quem escreve os cenários pode ser analista de QA, PO ou analista de negócio — através de uma planilha Excel. A plataforma valida a entrada, executa a suíte Cypress em segundo plano e devolve um relatório visual.

**Aplicação sob teste:** [automationpratice.com.br](https://automationpratice.com.br)

## Arquitetura

O projeto tem 3 camadas independentes:

```
┌─────────────────────────────────────────────┐
│  FRONTEND — Streamlit (Python)              │
│  Upload de planilha, visualização de result │
└────────────────┬────────────────────────────┘
                 │ HTTP
                 ▼
┌─────────────────────────────────────────────┐
│  BACKEND — Express (Node.js)                │
│  Validação, orquestração, geração de relat  │
└────────────────┬────────────────────────────┘
                 │ npx cypress run
                 ▼
┌─────────────────────────────────────────────┐
│  TESTES — Cypress                           │
│  Execução E2E dirigida por dados            │
└─────────────────────────────────────────────┘
```

Cada camada tem responsabilidade única e pode ser substituída sem afetar as outras.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Streamlit, pandas, openpyxl |
| Backend | Node.js, Express, multer, xlsx (SheetJS), zod |
| Testes | Cypress 15, Page Object Model, comandos customizados |
| Infra | Git com Conventional Commits, dotenv |

## Estrutura de pastas

```
├── backend/
│   ├── config/           # Constantes e config por ambiente
│   ├── services/         # Lógica de negócio (spreadsheet, cypress, HTML)
│   ├── routes/           # Endpoints Express Router
│   ├── middleware/       # Guards (concorrência)
│   ├── validators/       # Schemas zod
│   └── server.js         # Boot minimalista (22 linhas)
├── cypress/
│   ├── e2e/auth/         # Specs organizados por feature
│   ├── pages/            # Page Objects
│   ├── support/          # Comandos customizados
│   └── fixtures/         # Dados de teste
├── frontend/
│   └── app.py            # Streamlit app
├── .env.example
├── cypress.env.json.example
├── requirements.txt
└── package.json
```

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Python 3.10+
- Git

### Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/mathandrade/poc-automacao-cypress.git
cd poc-automacao-cypress

# 2. Instalar dependências do Node
npm install

# 3. Instalar dependências do Python
python -m pip install -r requirements.txt

# 4. Copiar templates de configuração (opcional)
cp .env.example .env
cp cypress.env.json.example cypress.env.json
```

### Executar

Você precisa de **2 terminais abertos em paralelo**:

**Terminal 1 — Backend:**
```bash
node backend/server.js
```

**Terminal 2 — Frontend:**
```bash
python -m streamlit run frontend/app.py
```

Acesse `http://localhost:8501` no navegador.

### Rodar Cypress isoladamente (para desenvolvimento)

```bash
npx cypress run --spec "cypress/e2e/auth/login.cy.js"
```

## Fluxo de uso

1. Baixe o modelo de planilha na interface (botão "Baixar modelo de planilha")
2. Preencha os cenários no Excel
3. Faça upload pela interface
4. Clique em "Executar Testes"
5. Visualize os resultados no dashboard e baixe o relatório HTML

## Modelo de dados

Cada linha da planilha é um cenário de teste com os campos:

| Coluna | Tipo | Descrição |
|---|---|---|
| `cenario` | string | Nome descritivo do teste |
| `email` | string | Dado do campo email (pode ser vazio) |
| `senha` | string | Dado do campo senha (pode ser vazio) |
| `resultado_esperado` | `sucesso` \| `erro` | Comportamento esperado |
| `mensagem_esperada` | string | Texto de erro que o site deve retornar |

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/upload-and-run` | Recebe planilha, valida e executa Cypress |
| GET | `/api/status` | Verifica se há execução em andamento |
| GET | `/api/generate-report` | Retorna HTML do último relatório |

## Padrões arquiteturais aplicados

- **Single Responsibility Principle** — cada módulo tem uma razão única para existir
- **Page Object Model** — encapsulamento de seletores e ações da UI de teste
- **Building Blocks Pattern** — comandos customizados de baixo e alto nível
- **Fail Fast** — validação de schema com zod antes de qualquer execução pesada
- **Express Middleware Pattern** — guard de concorrência via method wrapping
- **Data-Driven Testing** — geração dinâmica de casos de teste a partir de fixture

## Bugs conhecidos

- **FE-001**: Botão "Gerar Relatório HTML" no Streamlit não dispara ação. Contorno: acessar diretamente `http://localhost:3000/api/generate-report`.

## Roadmap

- [x] Refatoração dos testes (Page Object, comandos customizados)
- [x] Refatoração do backend em módulos
- [x] Validação de entrada com zod
- [x] Configuração por ambiente (.env)
- [ ] Correção do bug FE-001
- [ ] Testes mockados com `cy.intercept()`
- [ ] Novos cenários (cadastro, recuperação de senha)
- [ ] CI/CD com GitHub Actions
- [ ] Relatório com mochawesome + PDF

## Convenção de commits

Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/):

```
<tipo>(<escopo>): <descrição imperativa em inglês>
```

Prefixos usados: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.

## Licença

Este projeto está em fase de POC e não possui licença formal. Uso educacional livre.

## Autor

**Mateus Andrade** — QA SENIOR 

[GitHub](https://github.com/mathandrade) · [LinkedIn](https://www.linkedin.com/in/mateus-duarte-am/)