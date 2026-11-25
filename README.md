# POC de Automação Cypress dirigida por Planilha

Prova de conceito de automação de testes web em que quem define os cenários
(QA, PO ou analista de negócio) preenche uma planilha Excel e executa a suíte
Cypress por uma interface web, sem escrever código.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Cypress](https://img.shields.io/badge/Cypress-15.x-17202C?logo=cypress&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-frontend-FF4B4B?logo=streamlit&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

<!--
DEMONSTRAÇÃO: descomente este bloco quando os arquivos existirem em docs/.
Se publicar antes, as imagens aparecem quebradas.

## Demonstração

![Fluxo completo: planilha, execução, dashboard e relatório](docs/demo.gif)

| Dashboard de resultados | Relatório HTML (Mochawesome) |
|---|---|
| ![Dashboard](docs/dashboard.png) | ![Relatório](docs/relatorio.png) |
-->

## Sobre o projeto

Automatizar testes de fluxo web normalmente exige uma pessoa desenvolvedora.
Esta POC inverte esse modelo: quem escreve os cenários pode ser analista de QA,
PO ou analista de negócio, por meio de uma planilha Excel. A plataforma valida
a entrada, executa a suíte Cypress em segundo plano e gera um relatório visual.

**Aplicação sob teste:** [Automation Practice](http://automationpratice.com.br),
um site público de prática. Nenhum dado real é utilizado.

## Arquitetura

O projeto tem 3 camadas independentes:

```
┌──────────────────────────────────────────────────────┐
│  FRONTEND · Streamlit (Python)                       │
│  Upload da planilha e visualização dos resultados    │
└──────────────────────────┬───────────────────────────┘
                           │ HTTP
                           ▼
┌──────────────────────────────────────────────────────┐
│  BACKEND · Express (Node.js)                         │
│  Validação, orquestração e geração de relatórios     │
└──────────────────────────┬───────────────────────────┘
                           │ npx cypress run
                           ▼
┌──────────────────────────────────────────────────────┐
│  TESTES · Cypress                                    │
│  Execução E2E dirigida por dados                     │
└──────────────────────────────────────────────────────┘
```

Cada camada tem responsabilidade única e pode ser substituída sem afetar as
outras.

## Pilha

| Camada | Tecnologias |
|---|---|
| Frontend | Streamlit, pandas, openpyxl |
| Backend | Node.js, Express, multer, xlsx (SheetJS), zod |
| Testes | Cypress 15, Page Object Model, comandos personalizados |
| Relatórios | Mochawesome (HTML) |
| Qualidade de código | ESLint, Prettier |
| CI/CD | GitHub Actions |
| Infraestrutura | Git com commits convencionais, dotenv |

## Estrutura de pastas

```
├── .github/workflows/   # Pipeline de CI/CD
├── backend/
│   ├── config/          # Constantes e configuração por ambiente
│   ├── services/        # Lógica de negócio (planilha, Cypress, HTML)
│   ├── routes/          # Endpoints (Express Router)
│   ├── middleware/      # Guards (concorrência)
│   ├── validators/      # Schemas zod
│   └── server.js        # Boot minimalista (22 linhas)
├── cypress/
│   ├── e2e/auth/        # Specs organizados por feature
│   ├── pages/           # Page Objects
│   ├── support/         # Comandos customizados
│   └── fixtures/        # Dados de teste
├── frontend/
│   └── app.py           # Interface Streamlit
├── scripts/
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

### Execução

Você precisa de **2 terminais abertos em paralelo**:

**Terminal 1: Backend**

```bash
node backend/server.js
```

**Terminal 2: Interface**

```bash
python -m streamlit run frontend/app.py
```

Acesse `http://localhost:8501` no navegador.

### Rodar o Cypress isoladamente (para desenvolvimento)

```bash
npx cypress run --spec "cypress/e2e/auth/login.cy.js"
```

## Fluxo de uso

1. Baixe o modelo de planilha na interface (botão "Baixar modelo de planilha").
2. Preencha os cenários no Excel.
3. Faça o upload pela interface.
4. Clique em "Executar Testes".
5. Visualize os resultados no dashboard e baixe o relatório HTML.

## Modelo de dados

Cada linha da planilha é um cenário de teste, com os campos:

| Coluna | Tipo | Descrição |
|---|---|---|
| `cenario` | string | Nome descritivo do teste |
| `email` | string | Dado do campo e-mail (pode ser vazio) |
| `senha` | string | Dado do campo senha (pode ser vazio) |
| `resultado_esperado` | `sucesso` \| `erro` | Comportamento esperado |
| `mensagem_esperada` | string | Texto de erro que o site deve retornar |

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/upload-and-run` | Recebe a planilha, valida e executa o Cypress |
| GET | `/api/status` | Verifica se há execução em andamento |
| GET | `/api/generate-report` | Retorna o HTML do último relatório |

## Padrões arquiteturais aplicados

- **Princípio da Responsabilidade Única**: cada módulo tem uma única razão para existir.
- **Page Object Model**: encapsulamento de seletores e ações da UI de teste.
- **Building Blocks Pattern**: comandos personalizados de baixo e alto nível.
- **Fail Fast**: validação de schema com zod antes de qualquer execução pesada.
- **Express Middleware Pattern**: guard de concorrência via method wrapping.
- **Teste Orientado a Dados**: geração dinâmica de casos de teste a partir da planilha (fixture).

## Bugs conhecidos

- **FE-001**: o botão "Gerar Relatório HTML" no Streamlit não dispara a ação.
  Contorno: acessar diretamente `http://localhost:3000/api/generate-report`.

## Roteiro

- [x] Refatoração dos testes (Page Object, comandos customizados)
- [x] Refatoração do backend em módulos
- [x] Validação de entrada com zod
- [x] Configuração por ambiente (`.env`)
- [ ] Correção do bug FE-001
- [ ] Testes mockados com `cy.intercept()`
- [ ] Novos cenários (cadastro, recuperação de senha)
- [ ] Relatório com Mochawesome + PDF

## Convenção de commits

Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição imperativa em inglês>
```

Prefixos usados: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.

## Licença

Distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).

## Autor

**Mateus Andrade** · QA Engineer, automação de testes e IA aplicada a QA

[GitHub](https://github.com/mathandrade) · [LinkedIn](https://www.linkedin.com/in/mateus-duarte-am/)
