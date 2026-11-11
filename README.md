# Gerenciador de Projetos

Aplicação para listar, criar, editar, remover, favoritar e buscar projetos, com API em Ruby on Rails e frontend em Vue 3 + TypeScript.

- **Aplicação:** https://project-manager-eight.vercel.app
- **API:** https://project-manager-4mry.onrender.com

> A API usa o plano gratuito do Render, que desliga o serviço após 15 minutos sem acesso. O primeiro acesso pode levar cerca de um minuto.

## Stack

| Parte | Tecnologias |
|---|---|
| API (`api/`) | Ruby 4.0, Rails 8.1 (modo API), PostgreSQL, Active Storage, RSpec, FactoryBot |
| Frontend (`web/`) | Vue 3.5 + TypeScript, Vite, Vue Router, Pinia, Tailwind CSS v4, Vitest, Vue Test Utils |
| Deploy | Render (API), Neon (PostgreSQL), Cloudflare R2 (capas) e Vercel (frontend) |

## Como rodar

### Com Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:3000

O código é montado nos containers, então as alterações recarregam automaticamente. Para apagar tudo e começar do zero: `docker compose down -v`.

### Sem Docker

Requisitos: Ruby 4.0, Node 22.18+ ou 24.12+ e PostgreSQL na porta 5432. A conexão local pode ser ajustada com `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME` e `DATABASE_PASSWORD`.

```bash
cd api && bin/rails db:prepare && bin/rails server
cd web && npm install && npm run dev
```

## Testes

```bash
cd api && bundle exec rspec          # 120 exemplos
cd web && npm run test -- --run      # 122 testes
```

Com Docker: `docker compose exec api bundle exec rspec` e `docker compose exec web npm run test -- --run`.

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/projects` | Lista. Parâmetros: `search`, `favorite=true`, `sort` (`name`, `recent`, `deadline`) |
| GET | `/api/projects/:id` | Detalhe |
| POST | `/api/projects` | Cria (multipart, com capa opcional) |
| PATCH | `/api/projects/:id` | Atualiza (`remove_cover=true` remove a capa) |
| DELETE | `/api/projects/:id` | Remove |
| POST | `/api/projects/:id/favorite` | Favorita |
| DELETE | `/api/projects/:id/favorite` | Desfavorita |

Erros de validação retornam `422` com os erros por campo, e projeto inexistente retorna `404`.

## Decisões técnicas

### Estrutura
- **Monorepo** com `api/` e `web/`: um repositório, um README e um comando para subir tudo.

### API
- **Controllers enxutos:** a lógica de consulta fica em scopes no model, a resposta é montada por um serializer em Ruby puro e os erros são tratados uma única vez no `ApplicationController`.
- **Busca, filtro e ordenação na API.** A busca considera só o nome do projeto, conforme o design, ignora maiúsculas e minúsculas e só é aplicada a partir de 3 caracteres.
- **Ordenações pelas datas, comparando com o dia de hoje:**
  - "Iniciados mais recentes" mostra primeiro os projetos que já começaram, do início mais recente para o mais antigo, e depois os que ainda vão começar, do mais próximo para o mais distante.
  - "Prazo mais próximo" mostra primeiro os projetos ainda no prazo, da data final mais próxima para a mais distante, e depois os já finalizados, do mais recente para o mais antigo. Assim, um prazo vencido não aparece como "o mais próximo".
  - O "hoje" segue o fuso `America/Sao_Paulo`, e todas as ordenações usam o `id` como desempate, para a ordem não mudar entre requisições.
- **Total da listagem:** o `meta.total` conta os projetos retornados depois dos filtros. Com o filtro de favoritos ativo, o título mostra quantos favoritos existem, acompanhando a lista exibida, em vez do total de projetos cadastrados.
- **Consultas seguras:** o termo de busca passa por `sanitize_sql_like`, e a ordenação aceita só uma lista fechada de opções, nunca o valor recebido diretamente no `order`. Um valor desconhecido volta para a ordem alfabética.
- **N+1 evitado** na listagem com `with_attached_cover`, e índices nas colunas usadas para ordenar.
- **Favoritar como recurso** (`POST` e `DELETE /api/projects/:id/favorite`), em vez de uma ação que inverte o valor. As operações ficam idempotentes: repetir a mesma requisição, por um clique duplo ou um retry, não muda o resultado. O campo `favorite` não é aceito no create nem no update.
- **Validações:** campos obrigatórios no model e no banco, com `NOT NULL`. No model ficam também o nome com pelo menos duas palavras, conforme o design, e a data final não anterior à inicial, uma regra que adicionei.
- **Capa com Active Storage**, aceitando só JPG e PNG. O tipo é identificado pelo conteúdo do arquivo, e não pela extensão, então um GIF renomeado para `.png` é rejeitado.
- **Remoção da capa no model,** com o atributo virtual `remove_cover`. O controller continua simples, e, se a atualização falhar, a capa é mantida, porque o Active Storage só remove o arquivo depois que a transação é concluída.
- **Strong params com `params.expect`**, do Rails 8, deixando a conversão de tipos (datas e booleanos) a cargo do próprio Rails.
- **Poucas dependências, cada uma com um motivo:** `rspec-rails` e `factory_bot_rails` para testes, `rack-cors` para liberar o frontend em outro domínio e `aws-sdk-s3` para guardar as capas no Cloudflare R2. Considerei o **Ransack** para a busca e uma gem de serialização como o **Alba**, mas, com um único recurso e regras simples, scopes e um serializer em Ruby puro mantêm o código explícito e sem dependências extras.

### Frontend
- **Vue 3 com Composition API (`<script setup>`) e TypeScript**, com tipos que espelham o JSON da API.
- **Organização em camadas:** só `src/api/` faz chamadas HTTP, os componentes passam sempre pela store (Pinia), e a lógica reutilizável fica em composables (`useSearchHistory`, `useDebounceFn`, `useClickOutside`).
- **Estado da busca separado da listagem** na store, para que buscar não altere os filtros da lista. Respostas atrasadas de buscas antigas são descartadas.
- **Tailwind CSS v4** com os tokens extraídos do Figma (cores, fontes, tamanhos, bordas e sombras) definidos em `@theme`. As classes usam só esses tokens, sem valores soltos como `bg-[#...]`, e elementos repetidos viraram componentes.
- **Um único `ProjectForm`** para criação e edição. As validações no frontend repetem as regras da API com as mensagens do design, e os erros retornados pela API aparecem nos campos correspondentes.
- **Datas** formatadas com `Intl.DateTimeFormat` em pt-BR e `timeZone: 'UTC'`, evitando que `2024-09-01` apareça como 31 de agosto no fuso do Brasil.
- **Busca** a partir de 3 caracteres, com debounce de 300 ms (ou imediata com Enter), em uma rota própria (`/search?q=`), para que recarregar a página e o botão voltar funcionem.
- **Highlight sem `v-html`:** o nome é dividido em trechos e o termo encontrado vai dentro de um `<mark>`, impedindo que um nome de projeto injete HTML.
- **Histórico de buscas** no `localStorage`, com as 5 mais recentes, sem repetição. Quando um termo novo estende o último salvo ("Proj" → "Projeto"), ele substitui o anterior, para que a digitação não encha o histórico.
- **Estados não previstos no design**, como busca sem resultado, filtro de favoritos vazio, erro ao carregar e projeto inexistente, seguem o estilo do estado vazio. No carregamento, a lista e a busca mostram cards de esqueleto, a edição mostra um spinner e os botões indicam o envio ("Salvando..."). Uma capa que falha ao carregar volta para o placeholder.
- **Acessibilidade:** `aria-label` nos botões só com ícone, select de ordenação e menu do card operáveis pelo teclado, modal com `role="dialog"` e foco controlado, e campos com `<label>` e mensagens de erro associadas.

### Deploy
- **API no Render**, a partir do `Dockerfile` gerado pelo Rails 8. O Kamal veio com o Rails, mas o `config/deploy.yml` não está configurado para este deploy.
- **Banco no Neon**, em um único banco que também guarda as tabelas do Solid Queue, do Solid Cache e do Solid Cable. O Solid Queue roda dentro do Puma, para executar a remoção das capas sem precisar de um worker separado.
- **Capas no Cloudflare R2**, porque o plano gratuito do Render não mantém arquivos entre reinícios. O bucket é privado, e as imagens são servidas por URLs assinadas.
- **Frontend na Vercel**, com rewrite para o Vue Router funcionar ao recarregar qualquer rota.

## Limitações e próximos passos

- **Busca sem considerar acentos:** a busca ignora maiúsculas e minúsculas, mas não acentos ("projeto" não encontra "projéto"). A extensão `unaccent` do PostgreSQL resolveria.
- **Mensagens da API em inglês:** os erros de validação (`422`) usam as mensagens padrão do Rails. O formulário valida antes de enviar, então elas raramente aparecem, e uma tradução para pt-BR resolveria.
- **Sem paginação:** a listagem retorna todos os projetos, o que basta para o escopo do teste. Com muitos projetos, o próximo passo seria paginar na API.
- **Formato da data no formulário:** o campo de data é o nativo do navegador, então o formato segue o idioma do navegador (dd/mm/aaaa em português).
- **Sem CI:** os testes rodam localmente e no Docker. O próximo passo seria um workflow rodando `rspec` e `vitest` a cada push.

## Uso de IA

Usei o Claude Code como assistente durante o desenvolvimento: para acelerar a escrita de código e testes, revisar implementações e consultar o design pelo MCP do Figma (tokens, telas e ícones). As decisões de arquitetura e de produto foram minhas, e revisei todo o código gerado. O arquivo `CLAUDE.md` registra as convenções que o assistente seguiu.