# 🎨 Cine Pass Frontend

Este diretório encapsula a interface do usuário (SPA) do Cine Pass. Construído para ser uma vitrine de imersão de usuário e UX veloz, o frontend abandona as interfaces genéricas e abraça uma estética ousada.

## 📐 Design System & Estética

> 🖌️ **Mockups e Protótipos:** [Visualizar o board do Figma - Cine Pass Design Project](https://www.figma.com/design/YU8WBTTEUgTk70VLmZAtBo/Design-Project---CINEPASS?node-id=0-1&t=Ok9SFoy1isIhGm2T-1)

---

## 🔌 Consumo de Dados (A Arquitetura Híbrida)

O Frontend do Cine Pass é inteligente ao falar com a API: ele atua utilizando dois paradigmas simultâneos.

1. **Catálogo e Flow Social via GraphQL:**  
   Quando o usuário abre a página de um filme, precisamos de dezenas de referências (O Filme, a Sinopse, O Cast, os 5 reviews do topo, e se o usuário atual curte aquele filme). Em vez de disparar 6 requests REST paralelas, o Frontend dispara **uma única Query GraphQL** que monta exatamente os blocos que a Screen atual precisa desenhar.

2. **Booking e Checkout via REST:**  
   Na hora da compra (`POST /tickets/reserve`), a aplicação muda de marcha. Entra num escopo rígido consumindo roteamento REST estrito para engatilhar as "Locks" Pessimistas de alta concorrência do Banco de Dados.

---
*Este módulo é integrante do projeto de comprovação arquitetural Cine Pass.*
