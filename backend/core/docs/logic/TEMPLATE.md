# 🔍 Template de Auditoria de Lógica (screeK)

Utilize este modelo para mapear os fluxos de cada módulo. 

---

## 🚀 Fluxo: [Nome do Endpoint / Funcionalidade]

### 1. Handler (`internal/[modulo]/handler.go`)
- **Endpoint**: `[MÉTODO] /api/v1/...`
- **O que recebe**: `[Query Params, Body DTO, URL Params]`
- **Validações**: `[O que o handler valida antes de chamar o service?]`
- **Resposta Sucesso**: `[Status Code + DTO]`
- **Erros Comuns**: `[400, 401, 404...]`

### 2. Service (`internal/[modulo]/service.go`)
- **Lógica de Negócio**: 
    1. `Passo 1...`
    2. `Passo 2...`
- **Regras Críticas**: `[Ex: "Só pode reservar se houver assentos livres"]`
- **Dependências**: `[Quais outros services ou stores ele chama?]`
- **Eventos**: `[Dispara algum evento no EventBus?]`

### 3. Store (`internal/[modulo]/store.go` ou `repository.go`)
- **Query SQL/GORM**: `[O que ele busca ou salva no banco?]`
- **Relacionamentos**: `[Preload de quais tabelas?]`

### 4. Testes (`internal/[modulo]/..._test.go`)
- **Unitários**: `[O que está sendo testado isoladamente?]`
- **Integração**: `[Cenários reais com banco de dados]`
- 🚩 **Gap de Teste**: `[O que VOCÊ acha que falta testar aqui?]`

---

## 🚩 Lacunas Identificadas (Gaps)
- `[ ]` Lógica X ainda não implementada.
- `[ ]` Usuário Y pode fazer Z indevidamente? 
- `[ ]` Erro W não está sendo tratado.


A ordem de auditoria é fundamental para você não se sentir "perdido" em imports de outros módulos. Pensando nas dependências do ScreeK, a melhor estratégia é seguir a hierarquia de quem depende de quem.

Aqui está a ordem que recomendo, do "alicerce" para o "topo":

1. Auth & Users (A Base)
Tudo no sistema depende do Usuário e da Autenticação. Sem entender como o AuthMiddleware injeta o UserID no contexto, você terá dificuldades em entender os outros handlers.

Foco: JWT, Registro e Perfis.
2. Movies (A Entidade Central)
O filme é o objeto principal. Quase todos os outros módulos (Catalog, Bookings, Social) referenciam um Filme.

Foco: Integração com TMDB e Cache local.
3. Catalog (O primeiro nível de interação)
É o módulo mais simples que une Usuário + Filme (Watchlist e Listas). É ótimo para entender como o Go lida com relacionamentos muitos-para-muitos.

Foco: CRUD de listas e lógica de "favoritos".
4. Social (Interação entre Usuários)
Aqui a complexidade sobe um pouco, pois envolve o sistema de Seguidores e o Feed.

Foco: Lógica de Feed (quem sigo vs o que vejo) e concorrência em Likes/Comments.
5. Bookings (O "Chefão" da Lógica)
Este é o módulo mais denso. Ele depende de Filmes (Sessões) e Usuários (Compra), além de serviços externos (Stripe) e concorrência pesada (garantir que dois usuários não comprem o mesmo assento).

Foco: Locks no Redis (assentos), Webhooks e transações financeiras.
6. Management & Analytics (O nível Admin)
Módulos que gerenciam a infraestrutura (Cinemas/Salas) ou agregam dados dos anteriores.

Foco: Permissões de Admin e Jobs agendados (@midnight).