# Fluxo de Filmes, Cinemas e Elenco (Cine Pass)

O catálogo universal da plataforma, que vai funcionar juntando os dados perfeitos da nossa API (TMDB) e misturando com as informações do nosso Banco Privado (Cinemas, Ingressos e Redes Sociais).

## 1. Módulo de Pesquisa e Filtros
**Ação do Usuário:** Usa a barra de "Lupa" na categoria exata em que ele quer procurar algo (O App te obriga a escolher a aba certa para não bagunçar a lista de resultados).
- *Buscar por Filmes:* Se ele bater na lupa e adicionar filtros extras.
- *Buscar por Cast:* Se ele estiver procurando apenas por Diretores ou Atores Específicos.
- *(Buscar por Amigos ou Listas fica nas abas sociais)*
> **👉 Rotas do Backend:**
> - `GET /movies/search?q=Vingadores&genre=Acao&status=Em_Cartaz&year=2024`
> - `GET /people/search?q=Tom+Holland`

## 2. Detalhes de um Filme Específico
**Ação do Usuário:** Clica no super-pôster de um filme. Essa é a página mais rica e densa do aplicativo!
- *Metadados Básicos (Vêm do TMDB):* Título, Sinopse, Tempo de Duração, Gênero, Ano, País de Origem, Língua Original e URL do Trailer (Youtube).
- *Equipe (Vêm dos nossos dados espelhados):* Diretor e Elenco Principal.
- *Camada Social (Vêm do nosso Banco Postgres)*: 
  - Nota Global (Média de todas as reviews cadastradas).
  - Nota dos Amigos (Média da nota pra esse filme apenas de quem ele segue).
  - Nota do Usuário Logado (Se você mesmo já deu 4 estrelas, a API precisa avisar a tela pra pintar as estrelas de amarelo).
  - Lista de Reviews completas ordenadas pela data.
  - Recomendação com base nesse filme (Filmes Semelhantes).
> **👉 Rotas do Backend:**
> - `GET /movies/:id` (A Rota Ouro que mastiga tudo isso num super JSON).
> - `GET /movies/:id/recommendations` (Traz capas de filmes parecidos baseando na API de Recomendações do TMDB para facilitar o trabalho).
> - `POST /users/me/watchlist/:movie_id` (Adicionar à Watchlist)
> - `DELETE /users/me/watchlist/:movie_id` (Remover da Watchlist)

## 3. Detalhes de um Ator, Diretor ou Produtor (O Elenco)
**Ação do Usuário:** Ao estar na tela de um filme, clica na foto redonda de um Ator, descobrindo o portfólio de vida dele.
- *Informações Exibidas:* Nome real, Foto de Perfil, Biografia (Nascimento/Origem) e a super Filmografia Completa (Todos os filmes que esse cara trabalhou na vida separados por ator ou direção).
> **👉 Rotas do Backend:**
> - `GET /people/:id` (Traz os Detalhes Biográficos na Struct `Person`).
> - `GET /people/:id/movies` (Puxa do TMDB todos os `MovieCredits` associados a ele, pra não sobrecarregarmos nosso PostgreSQL com milhares de filmes antigos que o cara fez em 1980 sem ninguém buscar).

## 4. Detalhes Institucionais de um Cinema
**Ação do Usuário:** Entra no perfil corporativo de um Cinema logista (Ex: "Cinemark - Shopping Eldorado").
- *Informações Exibidas:* Endereço, Horário de Funcionamento, Telefone, Email e Site oficial, além da lista de filmes disponíveis em cartaz hoje nele.
> **👉 Rotas do Backend:**
> - `GET /cinemas/:id` (As informações cadastrais limpas do Cinema e contatos).
> - `GET /cinemas/:id/sessions?date=2026-03-05` (Pra mostrar os filmes na TV da bilheteria ou no APP do usuário com os horários e salas físicas do prédio).
