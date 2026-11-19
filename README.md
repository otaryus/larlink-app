# LarLink — frontend

Frontend React ligado à API REST Spring Boot em `../api`. A autenticação usa JWT emitido pela API; os dados de clientes, perfis, pedidos, matching e painel do agente vêm do PostgreSQL através do backend.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
```

Inicie primeiro o PostgreSQL e a API (ver `../api/README.md`). A URL padrão é `http://localhost:8080`; pode ser alterada em `VITE_API_URL` (ex.: criar `.env.local` com `VITE_API_URL=http://localhost:8080`). Para entrar como agente, use as credenciais criadas por `AGENT_EMAIL` e `AGENT_PASSWORD` no arranque da API. O registo público oferece apenas Cliente, Candidata e Empregada.

## Percursos por perfil

- **Cliente:** completa os contactos, pesquisa por cidade, serviço, dia e orçamento, descreve as tarefas, o salário, o horário e a duração, envia o pedido e acompanha as assinaturas e ocorrências.
- **Candidata / Empregada:** envia competências, disponibilidade e pretensão salarial, responde aos convites encaminhados pela agência e consulta/assina minutas com o escopo completo.
- **Agente:** painel com totais, aprova perfis, encaminha pedidos às candidatas, cria acessos de agente, revê contratos e trata ocorrências confidenciais.

As rotas e ações também são autorizadas no backend; esconder links no frontend serve apenas para manter cada percurso simples. A minuta usa IA quando `OPENAI_API_KEY` está configurada na API; sem chave, a app apresenta uma minuta estruturada local, identificada como não gerada com IA.

## Arquitectura

Monólito modular • Clean Architecture • Repository Pattern — aplicados ao frontend.

```
src/
  shared/
    domain/      erros, validadores, datas, políticas (salário mínimo, comissão…)
    ports/       Repository<T>, Clock, IdGenerator
    adapters/    InMemoryRepository, LocalStorageRepository  (Repository Adapters)
    ui/          design system: campos, Modal, Tabs, Portrait, hooks (useSubmit, useQuery…)
  modules/
    clients/  housekeepers/  placement/  contracts/  payments/  reviews/  reports/
      domain/       entidades + regras de negócio (funções puras)
      application/  casos de uso (Commands) — orquestração
      ports/        interfaces de repositório
      ui/           Interface Adapters: formulários (DTO → Command), páginas
  app/
    container.ts  composition root (liga adapters → ports → casos de uso)
    mockData.ts   dataset fictício construído com as fábricas do domínio
    layout/ pages/
```

Dependências apontam para dentro: `ui → application → domain`; `application → ports`; adapters implementam ports.
O módulo `placement` precisa de saber se uma empregada tem contrato activo — usa o port `ContractAvailability`,
implementado em `contracts/adapters`, evitando dependência circular entre módulos.

O cliente HTTP e o token de sessão estão em `src/shared/api/client.ts` e `src/modules/auth/ui/AuthContext.tsx`.

## Regras de negócio principais

| Módulo | Regras |
|---|---|
| Autenticação | nome completo, email válido e único, tipo de conta, palavra-passe 8+ caracteres com letra, número e símbolo, confirmação igual, aceitar termos; login com mensagem genérica para credenciais erradas |
| Clientes | nome completo, email válido e único, telemóvel MZ (82–87), endereço |
| Empregadas | ≥ 18 anos, ≥ 1 competência e dia, salário ≥ mínimo, telefone único; perfil PENDING → APPROVED/REJECTED (motivo ≥ 10 caract.) |
| Agenciamento | só perfis aprovados; competências/dias ⊆ oferta; início não no passado; sem pedido pendente duplicado; sem contrato activo |
| Contratos | só de pedido aprovado; salário ≥ mínimo e ≥ pretendido; 1–24 meses; 1 contrato activo por empregada; comissão 10% |
| Pagamentos | contrato activo; meses sequenciais; valores calculados pelo domínio; M-Pesa 84/85, e-Mola 86/87, NIB 21 dígitos |
| Avaliações | após 1.º pagamento ou fim do contrato; nota 1–5; nota ≤ 2 exige justificação ≥ 20 caract.; 1 por contrato |

Valores das políticas em `src/shared/domain/policies.ts` (assumidos para o protótipo).

## Testes existentes

- **Unidade (domínio):** `modules/*/domain/*.test.ts`, `shared/domain/*.test.ts`
- **Casos de uso:** `modules/*/application/*.test.ts` (repositórios em memória, relógio fixo)
- **UI — formulários:** `modules/*/ui/*Form.test.tsx`, `RejectionForm`, `HeroSearch`, `CandidateCard`
- **UI — páginas e navegação:** `app/App.test.tsx`, `app/pages.test.tsx`
- **Dataset fictício:** `app/mockData.test.ts` (números do dashboard e consistência das regras)

## Notas

- Fotos: retratos ilustrados em SVG (`shared/ui/Portrait.tsx`) como placeholder.
- Autenticação simulada no frontend (hash SHA-256 com salt, sessão em localStorage). Em produção pertence ao backend (HTTPS, bcrypt/argon2, tokens).
- Listas das páginas de gestão ordenadas do mais recente para o mais antigo.

## Arquitectura e qualidade

O frontend preserva a identidade visual existente e organiza regras por módulo:

- `domain`: entidades, validações e transições puras.
- `application`: casos de uso e comandos.
- `ports`: contratos de repositórios e serviços.
- `adapters`: implementações HTTP, sessão e persistência local.
- `ui`: páginas, formulários e componentes de apresentação.

A integração real com Spring Boot fica em `src/shared/api`. Regras de autorização continuam obrigatoriamente validadas no backend.

## Validação local

```bash
npm ci
npm test
npm run build
npm run lint
npm run dev
```

A suite de regressão cobre autenticação, formulários, perfis, pesquisa, pedidos, contratos, pagamentos, faltas, serviços adicionais, relatórios e páginas por papel. O lint é limitado a `src` para não analisar dependências instaladas.
