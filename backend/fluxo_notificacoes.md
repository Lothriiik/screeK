# Fluxo de Notificações (Cine Pass)

A central nervosa que engaja o usuário a não fechar o aplicativo e retornar sempre pra ver as novidades quentes do cinema e dos amigos.

## 1. Central (O Sininho)
**Ação do Usuário:** Clica no ícone de "Sino" no canto da tela (O emblema terá uma bolinha vermelha se houverem mensagens não lidas).
- *Na tela:* Uma lista mesclando os 3 tipos de Notificação (Social, Sistema e Lançamentos). O usuário clica na notificação e é levado direto para o Evento (ex: para o Perfil do Amigo, ou para a Página do Filme).
> ** Rotas do Backend:**
> - `GET /users/me/notifications` (Trás em ordem cronológica de recência)
> - `PUT /users/me/notifications/read-all` (Para zerar aquele contador da bolinha vermelha)

## 2. Notificações do Sistema / Compra (Push Interno)
Essas notificações são enviadas pelos próprios Jobs do Backend quando um evento físico vital acontece com a conta do usuário.
- *Exemplos:* 
  - "Sua Reserva expirou por falta de pegamento"
  - "Sua compra de ingresso para Homem-Aranha foi aprovada! Ver Ingresso."

## 3. Notificações Sociais (Conexões)
Gatilhos do comportamento comunitário. Traz movimento pro Hub Social.
- *Exemplos:*
  - "Maria começou a te seguir."
  - "Lucas curtiu a sua resenha em Os Vingadores."
  - "Ana comentou: 'Eu também acho!' na sua Resenha."

## 4. O Mega Gatilho da Watchlist (Lembrete de Lançamento)
**Ação do Usuário:** Colocou um filme que estava com a flag "Em Breve" dentro da Watchlist (Fluxo Filmes/Usuário) no mês passado. Passou o tempo, e Hoje estreou o filme no Cinema.
- *Comportamento do Sistema:* Um CRON (Robô Automatizado no Backend que roda toda meia-noite) varre a tabela do TMDB, nota esse lançamento num cinema da mesma cidade que a do usuário, e envia pro celular dele ativamente.
- *Aviso na Tela (Push Notification):* 🚨 **"Saiu do Forno! Homem-Aranha que estava na sua Watchlist acaba de chegar nos cinemas de São Paulo! Reserve já a sua poltrona!"**
