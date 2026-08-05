cy.intercept() não aplicável ao site sob teste (automationpratice.com.br)
Investigação via DevTools/Network confirmou que login e busca de produtos rodam 100% client-side — zero requisições Fetch/XHR em ambos os fluxos. Validações (email com @, senha ≥ 6 caracteres) são checadas em JS puro no navegador, sem backend de API por trás. cy.intercept() não tem o que interceptar nesse contexto. Item do roadmap fica documentado como "não aplicável ao site alvo" — não é dívida técnica, é característica da aplicação sob teste


vamos para opção A, e para opção b no futuro o que vc sugere? construir uma nova poc ou tem outras maneiras de aplicar isso sem ser em poc?

Mapeou alternativas práticas para dominar interceptação sem construir POC
Mapeou alternativas práticas para dominar interceptação sem construir POC

Opção A — fechando a investigação

Adiciona essa entrada no aprendizados.md:

cy.intercept() não aplicável ao site sob teste (automationpratice.com.br)
Investigação via DevTools/Network confirmou que login e busca de produtos rodam 100% client-side — zero requisições Fetch/XHR em ambos os fluxos. Validações (email com @, senha ≥ 6 caracteres) são checadas em JS puro no navegador, sem backend de API por trás. cy.intercept() não tem o que interceptar nesse contexto. Item do roadmap fica documentado como "não aplicável ao site alvo" — não é dívida técnica, é característica da aplicação sob teste.

Commit sugerido:

docs(cypress): document that intercept/mocking is not applicable to current test target

Isso fecha o item, sem ficar pendurado como "bloqueado" (diferente do Cypress.env, que tem um fix futuro esperado — aqui não tem fix, é a natureza do site).

Opção B — pra praticar cy.intercept() de verdade, no futuro

Não recomendo construir uma POC nova do zero — é trabalho grande pra praticar uma coisa específica. Duas alternativas bem mais leves:

Cypress Real World App (RWA) — app oficial mantido pelo próprio time do Cypress, feito especificamente pra ensinar padrões de intercept/stub/mock (tem backend real, dados seedados, cenários de erro de rede prontos). Só clona e roda:
git clone https://github.com/cypress-io/cypress-realworld-app

Ponto forte pra entrevista: é referência conhecida no mercado de QA — citar que você praticou nela já tem peso.

Página HTML mínima + API pública — se quiser algo ainda mais rápido: um único .html que faz fetch() numa API pública de teste (ex: reqres.in), servido localmente (nem precisa de servidor, um index.html aberto direto já basta pra gerar rede real pro Cypress interceptar). Só o suficiente pra demonstrar cy.intercept() em stub, delay simulado e erro forçado — sem construir aplicação nenhuma em volta.