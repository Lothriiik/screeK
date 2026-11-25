// screeK — tira prints de TODAS as telas do site e gera relatório.
//
// ══════════════════════════════════════════════════════════════════════════
//  SETUP (uma vez só, nesta pasta)
//    npm init -y && npm i -D playwright && npx playwright install chromium
//
//  SALVAR SESSÕES (uma vez por tipo de conta)
//    node shoot.mjs login user      # abre o navegador, faça login e Enter
//    node shoot.mjs login manager   # idem, conta MANAGER ou ADMIN
//    node shoot.mjs promote-manager # cria sessão MANAGER local a partir de auth-user.json (preview)
//
//  TIRAR OS PRINTS
//    node shoot.mjs                 # desktop + mobile, tema claro
//    node shoot.mjs --dark          # tema escuro
//    node shoot.mjs --mobile        # só mobile
//    node shoot.mjs --desktop       # só desktop
//    ONLY="cinema|tickets" node shoot.mjs  # filtra por nome de tela
//
//  VARIÁVEIS DE AMBIENTE OPCIONAIS
//    BASE=http://localhost:5173     # dev server local (padrão)
//    BASE=https://screek.vercel.app # apontar para produção
//    OUT=screenshots                # pasta de saída (padrão)
//    DARK=1                         # tema escuro
//    VIEWPORTS=desktop,mobile       # quais viewports
//    ONLY="cinema|feed"             # filtro de tela (regex)
//    SCROLL=0                       # desligar auto-scroll (padrão: ligado)
//
// ══════════════════════════════════════════════════════════════════════════

import { chromium, devices } from 'playwright';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import readline from 'node:readline/promises';
import path from 'node:path';

// ── Configuração ──────────────────────────────────────────────────────────
const BASE   = (process.env.BASE || 'http://localhost:5173').replace(/\/$/, '');
const OUT    = process.env.OUT  || 'screenshots';
const ONLY   = process.env.ONLY  ? new RegExp(process.env.ONLY, 'i') : null;
const DARK   = !!process.env.DARK || process.argv.includes('--dark');
const SCROLL = process.env.SCROLL !== '0';

// Viewports via flag ou env
let wantedVP = (process.env.VIEWPORTS || 'desktop,mobile').split(',').map(s => s.trim());
if (process.argv.includes('--desktop')) wantedVP = ['desktop'];
if (process.argv.includes('--mobile'))  wantedVP = ['mobile'];

const STATE = {
  user:    'auth-user.json',
  manager: 'auth-manager.json',
};

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile:  { ...devices['iPhone 13'] },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Modo login: salva sessão ───────────────────────────────────────────────
if (process.argv[2] === 'login') {
  const role = process.argv[3];
  if (!STATE[role]) {
    console.error('Use: node shoot.mjs login user|manager');
    process.exit(1);
  }
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: VIEWPORTS.desktop.viewport });
  const page    = await context.newPage();
  await page.goto(BASE);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await rl.question(`\nFaça login como "${role}" no navegador que abriu e depois aperte Enter aqui... `);
  rl.close();
  const auth = await page.evaluate(() => {
    try {
      const persisted = JSON.parse(localStorage.getItem('screek-auth') || 'null');
      const state = persisted?.state ?? persisted;
      return { authenticated: !!state?.isAuthenticated && !!state?.accessToken, role: state?.user?.role ?? null };
    } catch { return { authenticated: false, role: null }; }
  });
  const validRole = role === 'manager' ? ['MANAGER', 'ADMIN'].includes(auth.role) : auth.role === 'USER';
  if (!auth.authenticated || !validRole) {
    console.error(`Sessão não salva: esperado usuário ${role === 'manager' ? 'MANAGER ou ADMIN' : 'USER'}, encontrado ${auth.role ?? 'nenhum'}.`);
    await browser.close();
    process.exit(1);
  }
  await context.storageState({ path: STATE[role] });
  await browser.close();
  console.log(`✅ Sessão salva em ${STATE[role]}`);
  process.exit(0);
}

// Modo de preview local enquanto o fluxo de criação/atribuição de perfis B2B
// ainda não existe. Não altera a conta no backend nem o token de autenticação.
if (process.argv[2] === 'promote-manager') {
  if (!existsSync(STATE.user)) {
    console.error(`Sessão de usuário não encontrada: ${STATE.user}. Rode "node shoot.mjs login user" primeiro.`);
    process.exit(1);
  }

  const saved = JSON.parse(readFileSync(STATE.user, 'utf8'));
  const origin = saved.origins?.find((item) => item.origin === BASE);
  const authEntry = origin?.localStorage?.find((item) => item.name === 'screek-auth');
  let persisted;
  try { persisted = JSON.parse(authEntry?.value || 'null'); } catch { persisted = null; }
  const auth = persisted?.state ?? persisted;
  if (!auth?.isAuthenticated || !auth?.accessToken || !auth?.user) {
    console.error(`${STATE.user} não contém uma sessão autenticada válida.`);
    process.exit(1);
  }

  auth.user.role = 'MANAGER';
  authEntry.value = JSON.stringify(persisted);
  writeFileSync(STATE.manager, JSON.stringify(saved, null, 2), 'utf8');
  console.log(`Sessão de preview salva em ${STATE.manager} como MANAGER.`);
  console.log('Isso só altera o papel salvo no navegador local; não cria nem promove uma conta no backend.');
  process.exit(0);
}

// ── Helpers de navegação ──────────────────────────────────────────────────
async function go(page, urlPath, timeout = 30_000) {
  const url = urlPath.startsWith('http') ? urlPath : BASE + urlPath;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
  // aguarda rede ficar quieta, mas não bloqueia se demorar
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {});
}

/**
 * Aguarda o desaparecimento de elementos de loading/skeleton antes do print.
 * Estratégia:
 *  1. Espera qualquer `.animate-pulse` sumir (skeletons de cards/backdrop)
 *  2. Espera texto "Carregando..." sumir (Intelligence e similares)
 *  3. Espera imagens <img> visíveis terminarem de carregar (naturalWidth > 0)
 * Se nada sumir dentro de `maxWait`, captura mesmo assim (evita travar).
 */
async function waitForContent(page, maxWait = 15_000) {
  const deadline = Date.now() + maxWait;

  // 1. Aguarda .animate-pulse sumir
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('.animate-pulse').length === 0,
      { timeout: maxWait, polling: 300 }
    );
  } catch { /* timeout — continua mesmo assim */ }

  // 2. Aguarda textos de loading desaparecerem
  const remaining1 = deadline - Date.now();
  if (remaining1 > 0) {
    try {
      await page.waitForFunction(
        () => {
          const texts = ['Carregando', 'carregando', 'Loading', 'loading...'];
          return !texts.some(t =>
            [...document.querySelectorAll('p, span, div')]
              .some(el => el.children.length === 0 && el.textContent?.includes(t))
          );
        },
        { timeout: remaining1, polling: 400 }
      );
    } catch { /* timeout — continua */ }
  }

  // 3. Pausa extra para imagens começarem a pintar (lazy load + decode)
  await sleep(500);
}

/**
 * Vai a uma página de listagem e clica/navega para o primeiro href que casa
 * com `re`. Retorna o pathname que abriu, ou lança se não achar.
 */
async function openFirst(page, listPath, re) {
  await go(page, listPath);
  const hrefs = await page.$$eval('a[href]', (as) =>
    as.map((a) => a.getAttribute('href')).filter(Boolean)
  );
  const hit = hrefs
    .map((h) => { try { return new URL(h, BASE).pathname; } catch { return null; } })
    .find((p) => p && re.test(p));
  if (!hit) throw new Error(`nenhum link ${re} encontrado em ${listPath}`);
  await go(page, hit);
  return hit;
}

/** Rola a página para disparar imagens lazy e depois volta ao topo.
 *  Após rolar, aguarda todas as <img> visíveis terminarem de decodificar. */
async function autoScroll(page) {
  if (!SCROLL) return;

  // Rola em passos e repete se a página crescer ao carregar conteúdo lazy.
  await page.evaluate(async () => {
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let previousHeight = 0;
    for (let pass = 0; pass < 4; pass++) {
      const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const step = Math.max(350, Math.floor(window.innerHeight * 0.65));
      for (let y = 0; y < height; y += step) {
        window.scrollTo(0, y);
        await pause(180);
      }
      window.scrollTo(0, height);
      await pause(350);
      const newHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      if (newHeight <= height && newHeight === previousHeight) break;
      previousHeight = newHeight;
    }
    window.scrollTo(0, 0);
  });

  // Aguarda layout, fontes e imagens assentarem antes do print de página inteira.
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const images = [...document.images].filter((img) => img.getBoundingClientRect().width > 0);
    await Promise.race([
      Promise.all(images.map((img) => img.decode?.().catch(() => undefined))),
      new Promise((resolve) => setTimeout(resolve, 7000)),
    ]);
  }).catch(() => {});
  await page.waitForFunction(
    () => {
      const imgs = [...document.querySelectorAll('img')].filter(
        (img) => {
          const r = img.getBoundingClientRect();
          return r.width > 0 && r.height > 0; // visível no layout
        }
      );
      return imgs.length === 0 || imgs.every((img) => img.complete && img.naturalWidth > 0);
    },
    { timeout: 8_000, polling: 300 }
  ).catch(() => {}); // se não carregar tudo em 8s, segue mesmo assim
}

/** Cria um contexto de browser para um determinado viewport + sessão */
async function makeContext(browser, vpName, role) {
  const file  = STATE[role];        // 'guest' não tem arquivo de sessão
  const hasSt = file && existsSync(file);

  if (file && !hasSt) return null;  // sessão necessária mas ausente

  if (hasSt) {
    const saved = JSON.parse(readFileSync(file, 'utf8'));
    const origin = saved.origins?.find((item) => item.origin === BASE);
    const persisted = origin?.localStorage?.find((item) => item.name === 'screek-auth')?.value;
    let auth;
    try { auth = JSON.parse(persisted || 'null')?.state; } catch { auth = null; }
    const roleMatches = role === 'manager'
      ? ['MANAGER', 'ADMIN'].includes(auth?.user?.role)
      : auth?.user?.role === 'USER';
    if (!auth?.isAuthenticated || !auth?.accessToken || !roleMatches) {
      console.warn(`⚠  sessão ${file} não é válida para ${role} (perfil: ${auth?.user?.role ?? 'ausente'}); rode "node shoot.mjs login ${role}" com a conta correta.`);
      return null;
    }
  }

  return browser.newContext({
    ...VIEWPORTS[vpName],
    locale:         'pt-BR',
    colorScheme:    DARK ? 'dark' : 'light',
    reducedMotion:  'reduce',
    timezoneId:     'America/Sao_Paulo',
    ...(hasSt ? { storageState: file } : {}),
  });
}

// ── Lista de rotas ─────────────────────────────────────────────────────────
// Cada rota: { name, role, open }
// role: 'guest' | 'user' | 'manager'
// open: (page) => Promise<void>

const at = (p) => (page) => go(page, p);

/**
 * Navega para `urlPath` e clica no botão/link que contém `tabText`.
 * Aguarda o conteúdo novo aparecer após o clique.
 */
async function clickTab(page, urlPath, tabText) {
  await go(page, urlPath);
  // O conteúdo das abas também repete esses rótulos; use apenas botões e escolha
  // o primeiro visível na barra de navegação, sem combinar locators (strict mode).
  const candidates = page.getByRole('button', { name: new RegExp(tabText, 'i') });
  const count = await candidates.count();
  for (let index = 0; index < count; index++) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click({ timeout: 8_000 });
      await page.waitForFunction(
        (element) => element.className.includes('bg-primary'),
        await candidate.elementHandle(),
        { timeout: 3_000 },
      ).catch(() => sleep(250));
      return;
    }
  }
  throw new Error(`aba "${tabText}" não encontrada em ${urlPath}`);
}

async function openAuthModal(page, actionText) {
  await go(page, '/');
  const action = page.getByRole('button', { name: new RegExp(actionText, 'i') });
  let visible = false;
  for (let index = 0; index < await action.count(); index++) {
    if (await action.nth(index).isVisible().catch(() => false)) {
      await action.nth(index).click();
      visible = true;
      break;
    }
  }
  if (!visible) {
    await page.getByRole('button', { name: /abrir menu/i }).click();
    await page.getByRole('button', { name: new RegExp(actionText, 'i') }).last().click();
  }
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8_000 });
}

/**
 * Navega até a tela de checkout (/checkout/seats) e retorna a página
 * pronta para interagir com os steps.
 */
async function goToCheckout(page) {
  // A página de seleção é um fluxo local de demonstração e não depende do
  // backend de sessões. Entrar pelo catálogo tornava os prints frágeis.
  await go(page, '/checkout/seats?session=cga-speed-1');
  await page.getByText('1. Sala', { exact: true }).waitFor({ state: 'visible', timeout: 10_000 });
}

async function selectFirstAvailableSeat(page) {
  const seat = page.locator('button[title^="Assento "]:not([disabled])').first();
  await seat.waitFor({ state: 'visible', timeout: 10_000 });
  await seat.click();
  await sleep(250);
}

async function nextCheckoutStep(page) {
  const next = page.getByRole('button', { name: /Avançar|Pagamento/i }).first();
  await next.waitFor({ state: 'visible', timeout: 8_000 });
  await next.click();
  await sleep(300);
}

async function reachCheckoutPayment(page, method = 'pix') {
  await goToCheckout(page);
  await selectFirstAvailableSeat(page);
  await nextCheckoutStep(page); // assentos -> tipos de ingresso
  await nextCheckoutStep(page); // tipos de ingresso -> pagamento
  if (method === 'credit_card') {
    await page.getByRole('button', { name: /Cartão de Crédito/i }).click();
  }
  await sleep(250);
}

const ROUTES = [
  // ── PÚBLICAS ────────────────────────────────────────────────────────────
  { name: 'home',               role: 'guest', open: at('/') },

  // Busca — aceita ?tab= via URL (5 abas)
  { name: 'busca-filmes',       role: 'guest', open: at('/search?tab=movies') },
  { name: 'busca-pessoas',      role: 'guest', open: at('/search?tab=people') },
  { name: 'busca-usuarios',     role: 'guest', open: at('/search?tab=users') },
  { name: 'busca-listas',       role: 'guest', open: at('/search?tab=lists') },
  { name: 'busca-cinemas',      role: 'guest', open: at('/search?tab=cinemas') },

  // filmes
  { name: 'filmes-catalogo',    role: 'guest', open: at('/movies') },
  {
    name: 'filme-detalhe',
    role: 'guest',
    open: (p) => openFirst(p, '/movies', /^\/movies\/[^/]+$/),
  },
  {
    name: 'filme-sessoes',
    role: 'guest',
    open: async (p) => {
      const href = await openFirst(p, '/movies', /^\/movies\/[^/]+$/);
      await go(p, `${href}/sessions`);
    },
  },

  // cinemas
  { name: 'cinemas-lista',      role: 'guest', open: at('/cinemas') },
  {
    name: 'cinema-detalhe',
    role: 'guest',
    open: (p) => openFirst(p, '/cinemas', /^\/cinemas\/[^/]+$/),
  },

  // pessoa / elenco
  {
    name: 'pessoa-detalhe',
    role: 'guest',
    open: (p) => go(p, '/people/501'),
  },

  // social / feed
  { name: 'feed',               role: 'guest', open: at('/feed') },
  {
    name: 'feed-post-detalhe',
    role: 'guest',
    open: (p) => openFirst(p, '/feed', /^\/feed\/[^/]+$/),
  },
  {
    name: 'perfil-publico',
    role: 'guest',
    open: (p) => openFirst(p, '/feed', /^\/(users|u)\/[^/]+$/),
  },

  // listas & coleções
  { name: 'listas',             role: 'guest', open: at('/lists') },
  {
    name: 'lista-detalhe',
    role: 'guest',
    open: (p) => openFirst(p, '/lists', /^\/lists\/(?!new$)[^/]+$/),
  },
  { name: 'colecoes',           role: 'guest', open: at('/collections') },
  {
    name: 'colecao-detalhe',
    role: 'guest',
    open: (p) => openFirst(p, '/collections', /^\/collections\/[^/]+$/),
  },

  // Login abre pelo modal da navbar; cadastro tambÃ©m pode ser mostrado no modal.
  { name: 'login-modal',         role: 'guest', open: (p) => openAuthModal(p, 'FAZER LOGIN') },
  { name: 'cadastro',            role: 'guest', open: at('/register') },
  { name: 'cadastro-modal',      role: 'guest', open: (p) => openAuthModal(p, 'CRIAR CONTA') },
  { name: 'esqueci-senha',      role: 'guest', open: at('/forgot-password') },
  { name: 'redefinir-senha',    role: 'guest', open: at('/reset-password') },

  // informativas
  { name: 'termos',             role: 'guest', open: at('/terms') },
  { name: 'privacidade',        role: 'guest', open: at('/privacy') },
  { name: 'faq',                role: 'guest', open: at('/faq') },
  { name: 'contato',            role: 'guest', open: at('/contact') },
  { name: 'localizar-ingresso', role: 'guest', open: at('/tickets/find') },
  { name: 'solicitar-acesso-gestor', role: 'guest', open: at('/management/request-access') },
  { name: 'verificar-email',    role: 'guest', open: at('/verify-email') },
  { name: 'sessao-expirada',    role: 'guest', open: at('/session-expired') },

  // erros / dev
  { name: 'proibido-403',       role: 'guest', open: at('/forbidden') },
  { name: 'nao-encontrado-404', role: 'guest', open: at('/rota-inexistente-404') },
  { name: 'dev-components',     role: 'guest', open: at('/components') },
  { name: 'dev-prototypes',     role: 'guest', open: at('/prototypes') },
  { name: 'dev-estados',        role: 'guest', open: at('/dev/states') },

  // ── LOGADO (usuário comum) ───────────────────────────────────────────────
  { name: 'onboarding',         role: 'user',  open: at('/onboarding') },

  // Perfil — 6 abas: diary | posts | watched | reviews | passport | lists
  { name: 'perfil-diario',      role: 'user',  open: (p) => clickTab(p, '/profile', 'Diário') },
  { name: 'perfil-posts',       role: 'user',  open: (p) => clickTab(p, '/profile', 'Posts') },
  { name: 'perfil-assistidos',  role: 'user',  open: (p) => clickTab(p, '/profile', 'Assistidos') },
  { name: 'perfil-reviews',     role: 'user',  open: (p) => clickTab(p, '/profile', 'Reviews') },
  { name: 'perfil-passaporte',  role: 'user',  open: (p) => clickTab(p, '/profile', 'Passaporte') },
  { name: 'perfil-listas',      role: 'user',  open: (p) => clickTab(p, '/profile', 'Listas') },

  { name: 'perfil-stats',       role: 'user',  open: at('/profile/stats') },

  // Configurações — 4 abas: profile | notifications | privacy | security
  { name: 'config-perfil',      role: 'user',  open: (p) => clickTab(p, '/settings', 'Perfil') },
  { name: 'config-notificacoes',role: 'user',  open: (p) => clickTab(p, '/settings', 'Notificações') },
  { name: 'config-privacidade', role: 'user',  open: (p) => clickTab(p, '/settings', 'Privacidade') },
  { name: 'config-seguranca',   role: 'user',  open: (p) => clickTab(p, '/settings', 'Segurança') },

  { name: 'notificacoes',       role: 'user',  open: at('/notifications') },

  // Ingressos — 2 abas: active | history
  { name: 'ingressos-ativos',   role: 'user',  open: (p) => clickTab(p, '/tickets', 'Próximos') },
  { name: 'ingressos-historico',role: 'user',  open: (p) => clickTab(p, '/tickets', 'Histórico') },

  { name: 'lista-nova',         role: 'user',  open: at('/lists/new') },
  { name: 'intelligence',       role: 'user',  open: at('/intelligence') },
  { name: 'importar-letterboxd',role: 'user',  open: at('/import') },

  // ── CHECKOUT / SELEÇÃO DE POLTRONAS (7 estados) ──────────────────────────
  // Step 1: seats (inicial, sem poltronas selecionadas)
  {
    name: 'checkout-seats-inicial',
    role: 'guest',
    open: goToCheckout,
  },
  // Step 1: seats (com poltronas selecionadas)
  {
    name: 'checkout-seats-selecionadas',
    role: 'guest',
    open: async (p) => {
      await goToCheckout(p);
      await selectFirstAvailableSeat(p);
    },
  },
  // Step 2: tickets (escolher tipo de ingresso/bomboniere)
  {
    name: 'checkout-tickets',
    role: 'guest',
    open: async (p) => {
      await goToCheckout(p);
      await selectFirstAvailableSeat(p);
      await nextCheckoutStep(p);
    },
  },
  // Step 3: payment — método PIX (antes de gerar código)
  {
    name: 'checkout-payment-pix',
    role: 'guest',
    open: (p) => reachCheckoutPayment(p),
  },
  // Step 3: payment — PIX gerado (após clicar em "Gerar código PIX")
  {
    name: 'checkout-payment-pix-gerado',
    role: 'guest',
    open: async (p) => {
      await reachCheckoutPayment(p);
      await p.getByRole('button', { name: /Gerar Código PIX/i }).click();
      await sleep(1500); // aguarda código aparecer
    },
  },
  // Step 3: payment — Cartão de crédito
  {
    name: 'checkout-payment-cartao',
    role: 'guest',
    open: (p) => reachCheckoutPayment(p, 'credit_card'),
  },
  // Step 4: confirmation (resumo final)
  {
    name: 'checkout-confirmation',
    role: 'guest',
    open: async (p) => {
      await reachCheckoutPayment(p);
      await p.getByRole('button', { name: /Gerar Código PIX/i }).click();
      await sleep(250);
      await p.getByRole('button', { name: /Confirmar Pagamento PIX/i }).click();
      await sleep(500);
    },
  },

  // ── GESTÃO (MANAGER / ADMIN) ─────────────────────────────────────────────
  { name: 'b2b-cinemas',        role: 'manager', open: at('/management/cinemas') },
  { name: 'b2b-cinema-novo',    role: 'manager', open: at('/management/cinemas/new') },
  {
    name: 'b2b-cinema-editar',
    role: 'manager',
    open: (p) =>
      openFirst(p, '/management/cinemas', /^\/management\/cinemas\/[^/]+\/edit$/),
  },
  { name: 'b2b-programacao',    role: 'manager', open: at('/management/schedule') },
  { name: 'b2b-estatisticas',   role: 'manager', open: at('/management/statistics') },
  { name: 'b2b-operacoes',      role: 'manager', open: at('/management/operations?tab=orders') },
  { name: 'b2b-portaria',       role: 'manager', open: at('/management/check-in') },
  // Usa a sessÃ£o local de preview MANAGER; a API nÃ£o concede papel ADMIN.
  { name: 'admin-plataforma-preview', role: 'manager', open: at('/platform?tab=overview') },
];



// ── Execução principal ────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const report  = [];
let   n       = 0;
let   ok_     = 0;
let   total   = 0;

console.log(`\n🎬 screeK screenshot runner`);
console.log(`   BASE: ${BASE}`);
console.log(`   Viewports: ${wantedVP.join(', ')}`);
console.log(`   Tema: ${DARK ? 'escuro' : 'claro'}`);
if (ONLY) console.log(`   Filtro: ${ONLY}`);
console.log('');

for (const vpName of wantedVP) {
  if (!VIEWPORTS[vpName]) {
    console.warn(`viewport desconhecido: ${vpName} — pulando`);
    continue;
  }
  mkdirSync(`${OUT}/${vpName}`, { recursive: true });

  // Cria um contexto por role, reutilizado em todas as rotas deste viewport
  const contexts = {};
  for (const role of ['guest', 'user', 'manager']) {
    const ctx = await makeContext(browser, vpName, role);
    if (ctx) {
      contexts[role] = ctx;
    } else if (role !== 'guest') {
      console.warn(`⚠  sem sessão para "${role}" (${STATE[role]}) — telas "${role}" serão puladas`);
      console.warn(`   Para criar: node shoot.mjs login ${role}\n`);
    }
  }

  for (const route of ROUTES) {
    if (ONLY && !ONLY.test(route.name)) continue;
    const ctx = contexts[route.role];
    if (!ctx) {
      total++;
      report.push({
        viewport: vpName,
        role: route.role,
        name: route.name,
        file: null,
        ok: false,
        skipped: true,
        error: `sessão ${route.role} ausente ou inválida`,
        consoleErrors: [],
        badResponses: [],
      });
      console.log(`⏭ [${vpName}] ${route.role}/${route.name} — sessão ausente/inválida`);
      continue;
    }

    total++;
    const page   = await ctx.newPage();
    const issues = { consoleErrors: [], badResponses: [] };

    page.on('console',   (m) => { if (m.type() === 'error') issues.consoleErrors.push(m.text().slice(0, 300)); });
    page.on('pageerror', (e) => issues.consoleErrors.push(String(e).slice(0, 300)));
    page.on('response',  (r) => { if (r.status() >= 400) issues.badResponses.push(`${r.status()} ${r.url().slice(0, 200)}`); });

    const idx  = String(++n).padStart(3, '0');
    const file = path.join(OUT, vpName, `${idx}-${route.role}-${route.name}.png`);
    const row  = { viewport: vpName, role: route.role, name: route.name, file, ok: false, ...issues };

    try {
      await route.open(page);

      if (route.role !== 'guest') {
        const currentPath = new URL(page.url()).pathname;
        if (['/', '/login', '/register', '/forbidden'].includes(currentPath)) {
          throw new Error(`sessão ${route.role} não autorizada; redirecionado para ${currentPath}`);
        }
        const guardMessage = page.getByRole('heading', { name: /Entre para acessar esta área/i });
        if (await guardMessage.count()) {
          throw new Error(`sessão ${route.role} não autenticada; a tela protegida pediu login`);
        }
      }

      // Aguarda skeletons/loading sumirem — budget maior para APIs lentas
      const slowRoutes = ['intelligence', 'b2b-estatisticas', 'b2b-programacao'];
      const contentBudget = slowRoutes.includes(route.name) ? 25_000 : 15_000;
      await waitForContent(page, contentBudget);

      await autoScroll(page);
      await sleep(500);
      row.documentHeight = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
      await page.screenshot({
        path: file,
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
        timeout: 60_000,
      });

      row.ok       = true;
      row.finalUrl = page.url().replace(BASE, '') || '/';
      row.title    = await page.title();
      ok_++;
      console.log(`✅ [${vpName}] ${route.role}/${route.name}  →  ${row.finalUrl}`);
    } catch (e) {
      row.error = String(e.message || e).split('\n')[0].slice(0, 200);
      // tenta um print parcial para debug
      await page.screenshot({ path: file.replace('.png', '-ERRO.png') }).catch(() => {});
      console.log(`❌ [${vpName}] ${route.role}/${route.name}  —  ${row.error}`);
    }

    Object.assign(row, issues);
    report.push(row);
    await page.close();
  }

  for (const c of Object.values(contexts)) await c.close();
}

await browser.close();

// ── Relatório ─────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true });

writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2), 'utf-8');

const md = [
  '# Relatório de prints — screeK',
  '',
  `Gerado em: ${new Date().toLocaleString('pt-BR')}  |  BASE: \`${BASE}\``,
  '',
  `**${ok_}/${total}** telas capturadas com sucesso.`,
  '',
  '| # | Tela | Viewport | Status | URL final | Erros console | Resp. 4xx/5xx |',
  '|---|------|----------|--------|-----------|---------------|---------------|',
  ...report.map((r, i) => {
    const status = r.ok ? '✅ ok' : r.skipped ? `⏭ ${r.error}` : `❌ ${r.error || 'erro'}`;
    return `| ${i + 1} | ${r.role}/${r.name} | ${r.viewport} | ${status} | \`${r.finalUrl || ''}\` | ${r.consoleErrors.length} | ${r.badResponses.length} |`;
  }),
  '',
  '---',
  '',
  '## Erros de console (detalhes)',
  '',
  ...report
    .filter((r) => r.consoleErrors.length > 0)
    .flatMap((r) => [
      `### ${r.role}/${r.name} (${r.viewport})`,
      ...r.consoleErrors.map((e) => `- \`${e}\``),
      '',
    ]),
  '## Respostas HTTP com erro (detalhes)',
  '',
  ...report
    .filter((r) => r.badResponses.length > 0)
    .flatMap((r) => [
      `### ${r.role}/${r.name} (${r.viewport})`,
      ...r.badResponses.map((e) => `- \`${e}\``),
      '',
    ]),
].join('\n');

writeFileSync(path.join(OUT, 'report.md'), md, 'utf-8');

console.log(`\n${'─'.repeat(60)}`);
console.log(`✅ ${ok_}/${total} telas — relatório em ${OUT}/report.md`);
if (ok_ < total) {
  console.log(`\n⚠  Telas com erro: ${report.filter((r) => !r.ok).map((r) => r.name).join(', ')}`);
}
