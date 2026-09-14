const API_BASE_STORAGE_KEY = "taro.portal.apiBaseUrl";
const PORTAL_TOKEN_STORAGE_KEY = "taro.portal.accessToken";
const PORTAL_EXPIRES_STORAGE_KEY = "taro.portal.expiresAt";
const CHECKOUT_STATE_KEY = "taro.portal.checkoutState.v3";
const LEGAL_DOCUMENT_VERSION = "2026-09-14";
const AUTH_ACCESS_TOKEN_STORAGE_KEY = "taro.portal.authAccessToken";
const AUTH_REFRESH_TOKEN_STORAGE_KEY = "taro.portal.authRefreshToken";
const AUTH_USER_STORAGE_KEY = "taro.portal.authUser";
const AUTH_PENDING_EMAIL_KEY = "taro.portal.pendingEmail";

const API_BASE_URL =
  localStorage.getItem(API_BASE_STORAGE_KEY) ||
  window.TARO_PORTAL_CONFIG?.apiBaseUrl ||
  "http://localhost:5000";

const cardBackUrl = "/assets/card-back-small.jpg";
const cardFrontUrl = "/assets/card-front-small.jpg";

function renderBrandMark(className = "") {
  return `
    <svg class="${className}" viewBox="0 0 160 100" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M8 50C27 24 51 12 80 12C109 12 133 24 152 50C133 76 109 88 80 88C51 88 27 76 8 50Z"
        stroke="#6F35E8"
        stroke-width="8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M78 27A24 24 0 1 0 102 51A20 20 0 0 1 78 27Z"
        fill="#A86BFF"
      />
    </svg>
  `;
}

// TODO before publishing: replace every placeholder below with the real details
// of the self-employed service provider. YooKassa checks that these are genuine.
const sellerDetails = {
  fullName: "Васюта Александр Павлович",
  inn: "650122553219",
  status: "Плательщик налога на профессиональный доход (самозанятый)",
  email: "vaapptaro@mail.ru",
  postalAddress: "г. Владивосток, Приморский край",
};

const plans = [
  {
    code: "plus_1m",
    months: 1,
    title: "1 месяц",
    price: 449,
    badge: "быстрый старт",
    stars: 150,
    description: "Подходит, чтобы спокойно попробовать Plus и все расширенные расклады.",
  },
  {
    code: "plus_3m",
    months: 3,
    title: "3 месяца",
    price: 1190,
    badge: "выгоднее",
    stars: 150,
    description: "Для регулярной практики, истории раскладов и накопления личной статистики.",
  },
  {
    code: "plus_6m",
    months: 6,
    title: "6 месяцев",
    price: 2190,
    badge: "глубокая работа",
    stars: 150,
    description: "Для тех, кто возвращается к картам каждую неделю и хочет больше звёзд.",
  },
  {
    code: "plus_12m",
    months: 12,
    title: "12 месяцев",
    price: 3990,
    badge: "лучшее предложение",
    stars: 150,
    description: "Год доступа к Plus, расширенным функциям и регулярным начислениям звёзд.",
  },
];

const starPacks = [
  { code: "none", stars: 0, price: 0, title: "Без пакета" },
  { code: "stars_50", stars: 50, price: 199, title: "50 звёзд" },
  { code: "stars_120", stars: 120, price: 399, title: "120 звёзд" },
  { code: "stars_300", stars: 300, price: 899, title: "300 звёзд" },
  { code: "stars_750", stars: 750, price: 1990, title: "750 звёзд" },
];

const app = document.querySelector("#app");

const state = {
  isBootstrapping: true,
  me: null,
  authUser: loadAuthUser(),
  error: "",
  notice: "",
  route: getRoute(),
  checkout: loadCheckoutState(),
};

let authRefreshPromise = null;

window.addEventListener("popstate", () => {
  state.route = getRoute();
  render();
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-link]");
  if (!link) return;

  event.preventDefault();
  navigate(link.getAttribute("href"));
});

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;

  const actionName = action.dataset.action;

  if (actionName === "select-plan") {
    setCheckoutState({ planCode: action.dataset.plan, autoRenewEnabled: false });
    navigate(`/subscription?plan=${encodeURIComponent(action.dataset.plan)}`);
  }

  if (actionName === "buy-subscription") {
    const planCode = getSearchParam("plan") || state.checkout.planCode || "plus_1m";
    setCheckoutState({ planCode, autoRenewEnabled: false });
    navigate(`/checkout?plan=${encodeURIComponent(planCode)}`);
  }

  if (actionName === "checkout-plan") {
    setCheckoutState({ planCode: action.dataset.plan });
    render();
  }

  if (actionName === "checkout-stars") {
    setCheckoutState({ starPackCode: action.dataset.stars });
    render();
  }

  if (actionName === "toggle-checkout-auto-renew") {
    setCheckoutState({ autoRenewEnabled: action.checked });
    render();
  }

  if (actionName === "stars-only") {
    setCheckoutState({ planCode: "none", starPackCode: "stars_120" });
    navigate("/stars");
  }

  if (actionName === "stars-pack") {
    setCheckoutState({ planCode: "none", starPackCode: action.dataset.stars });
    render();
  }

  if (actionName === "continue-to-method") {
    navigate(
      `/payment-method?plan=${encodeURIComponent(state.checkout.planCode)}&stars=${encodeURIComponent(
        state.checkout.starPackCode
      )}`
    );
  }

  if (actionName === "select-method") {
    setCheckoutState({ paymentMethod: action.dataset.method });
    navigate("/confirm");
  }

  if (actionName === "create-payment") {
    createPayment(action);
  }

  if (actionName === "toggle-auto-renew") {
    updateAutoRenew(action);
  }

  if (actionName === "refresh-account") {
    bootstrap();
  }

  if (actionName === "logout") {
    clearAuthState();
    state.me = null;
    state.notice = "Вы вышли из аккаунта.";
    navigate("/");
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-form]");
  if (!form) return;

  event.preventDefault();

  const formName = form.dataset.form;

  if (formName === "login") {
    submitLogin(form);
  }

  if (formName === "register") {
    submitRegister(form);
  }

  if (formName === "verify-email") {
    submitVerifyEmail(form);
  }
});

bootstrap();

async function bootstrap() {
  state.isBootstrapping = true;
  state.error = "";
  render();

  try {
    await exchangeLinkTokenIfNeeded();
    await ensurePortalSessionFromAuth();
    await loadMe();
  } catch (error) {
    state.error = getErrorMessage(error);
  } finally {
    state.isBootstrapping = false;
    render();
  }
}

async function exchangeLinkTokenIfNeeded() {
  const linkToken = new URLSearchParams(window.location.search).get("t");
  if (!linkToken) return;

  await exchangePortalLinkToken(linkToken);
  window.history.replaceState(null, "", window.location.pathname || "/");
}

async function exchangePortalLinkToken(linkToken) {
  const response = await fetch(`${API_BASE_URL}/api/billing/portal/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: linkToken }),
  });

  const data = await parseResponse(response);

  sessionStorage.setItem(PORTAL_TOKEN_STORAGE_KEY, data.portalAccessToken);
  sessionStorage.setItem(PORTAL_EXPIRES_STORAGE_KEY, data.expiresAt);
}

async function loadMe() {
  const token = getPortalToken();
  if (!token) return;

  const response = await fetch(`${API_BASE_URL}/api/billing/portal/me`, {
    headers: {
      "X-Billing-Portal-Token": token,
    },
  });

  state.me = await parseResponse(response);
}

async function ensurePortalSessionFromAuth() {
  if (getPortalToken()) return;

  if (!getAuthAccessToken() && !getAuthRefreshToken()) return;

  const response = await authenticatedFetch(`${API_BASE_URL}/api/billing/portal-links`, {
    method: "POST",
  });

  const data = await parseResponse(response);
  const portalUrl = new URL(data.url, window.location.origin);
  const linkToken = portalUrl.searchParams.get("t");

  if (!linkToken) {
    throw new Error("Сервер не вернул токен портала.");
  }

  await exchangePortalLinkToken(linkToken);
}

async function authenticatedFetch(url, options = {}) {
  let accessToken = getAuthAccessToken();

  if (!accessToken) {
    accessToken = await refreshAuthTokens();
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status !== 401) {
    return response;
  }

  accessToken = await refreshAuthTokens();
  response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response;
}

async function refreshAuthTokens() {
  if (authRefreshPromise) return authRefreshPromise;

  authRefreshPromise = performAuthTokenRefresh().finally(() => {
    authRefreshPromise = null;
  });

  return authRefreshPromise;
}

async function performAuthTokenRefresh() {
  const refreshToken = getAuthRefreshToken();

  if (!refreshToken) {
    clearAuthState();
    throw new Error("Сессия истекла. Войдите в аккаунт ещё раз.");
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  try {
    const data = await parseResponse(response);

    if (!data?.accessToken || !data?.refreshToken) {
      throw new Error("Сервер не вернул новые данные сессии.");
    }

    localStorage.setItem(AUTH_ACCESS_TOKEN_STORAGE_KEY, data.accessToken);
    localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);

    if (data.user) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(data.user));
      state.authUser = data.user;
    }

    return data.accessToken;
  } catch (error) {
    clearAuthState();
    throw error;
  }
}

async function createPayment(button) {
  const token = getPortalToken();
  if (!token) {
    state.error = "Сессия портала не найдена. Войдите на сайте или откройте ссылку из приложения ещё раз.";
    render();
    return;
  }

  button.disabled = true;
  button.textContent = "Создаём оплату...";

  try {
    const response = await fetch(`${API_BASE_URL}/api/billing/portal/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Billing-Portal-Token": token,
      },
      body: JSON.stringify({
        planCode: state.checkout.planCode,
        starPackCode: state.checkout.starPackCode,
        autoRenewEnabled:
          state.checkout.planCode !== "none" && state.checkout.autoRenewEnabled,
      }),
    });

    const data = await parseResponse(response);
    window.location.href = data.confirmationUrl;
  } catch (error) {
    state.error = getErrorMessage(error);
    render();
  }
}

async function updateAutoRenew(button) {
  const token = getPortalToken();
  const subscription = state.me?.subscription;
  if (!token || !subscription) return;

  const enabled = button.dataset.enabled === "true";
  button.disabled = true;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/billing/portal/subscriptions/${subscription.id}/auto-renew`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Billing-Portal-Token": token,
        },
        body: JSON.stringify({ enabled }),
      }
    );

    await parseResponse(response);
    await loadMe();
    state.error = "";
    state.notice = enabled
      ? "Автоматическое продление включено."
      : "Автоматическое продление отключено. Доступ сохранится до конца оплаченного периода.";
  } catch (error) {
    const message = getErrorMessage(error);
    state.error = message.includes("make a new subscription payment")
      ? "Для включения автопродления сначала оплатите подписку, отметив сохранение способа оплаты."
      : message;
  }

  render();
}

async function submitLogin(form) {
  await submitAuthForm(form, "/api/auth/login");
}

async function submitRegister(form) {
  await submitAuthForm(form, "/api/auth/register");
}

async function submitAuthForm(form, endpoint) {
  const button = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  state.error = "";
  state.notice = "";

  if (endpoint === "/api/auth/register" && !isPasswordValid(password)) {
    state.error = "Пароль должен содержать минимум 8 символов, заглавную и строчную буквы и цифру.";
    render();
    return;
  }

  setButtonLoading(button, "Проверяем...");

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await parseResponse(response);

    if (data.type === "emailVerificationRequired") {
      sessionStorage.setItem(AUTH_PENDING_EMAIL_KEY, data.email || email);
      state.notice = "Мы отправили код подтверждения на почту.";
      navigate(`/verify-email?email=${encodeURIComponent(data.email || email)}`);
      return;
    }

    await finishAuthenticated(data);
  } catch (error) {
    state.error = getErrorMessage(error);
    render();
  } finally {
    resetButtonLoading(button);
  }
}

async function submitVerifyEmail(form) {
  const button = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim();
  const code = String(formData.get("code") || "").trim();

  state.error = "";
  state.notice = "";
  setButtonLoading(button, "Подтверждаем...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await parseResponse(response);
    sessionStorage.removeItem(AUTH_PENDING_EMAIL_KEY);
    await finishAuthenticated(data);
  } catch (error) {
    state.error = getErrorMessage(error);
    render();
  } finally {
    resetButtonLoading(button);
  }
}

async function finishAuthenticated(data) {
  const accessToken = data.accessToken;
  const refreshToken = data.refreshToken;
  const user = data.user;

  if (!accessToken || !refreshToken || !user) {
    throw new Error("Сервер не вернул данные входа.");
  }

  localStorage.setItem(AUTH_ACCESS_TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));

  state.authUser = user;
  state.me = null;
  state.notice = "Вход выполнен. Личный кабинет оплаты открыт.";
  sessionStorage.removeItem(PORTAL_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(PORTAL_EXPIRES_STORAGE_KEY);

  await ensurePortalSessionFromAuth();
  await loadMe();
  navigate("/tariffs");
}

function setButtonLoading(button, text) {
  if (!button) return;

  button.dataset.originalText = button.textContent;
  button.disabled = true;
  button.textContent = text;
}

function resetButtonLoading(button) {
  if (!button) return;

  button.disabled = false;
  button.textContent = button.dataset.originalText || button.textContent;
  delete button.dataset.originalText;
}

function render() {
  updatePageMetadata();

  if (state.isBootstrapping) {
    app.innerHTML = renderShell(renderLoading(), false);
    return;
  }

  const content = renderRoute();
  app.innerHTML = renderShell(content, state.route.path === "/");
}

function updatePageMetadata() {
  const isOfferPage = state.route.path === "/offer";
  let robotsMeta = document.querySelector('meta[name="robots"]');

  document.title = isOfferPage ? "Публичная оферта — Таро Путь" : "Таро Путь";

  if (isOfferPage) {
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.name = "robots";
      document.head.appendChild(robotsMeta);
    }

    robotsMeta.content = "noindex, follow";
    return;
  }

  robotsMeta?.remove();
}

function renderRoute() {
  if (requiresPortalSession(state.route.path) && !getPortalToken()) {
    return renderAuthRequiredPage();
  }

  if (state.route.path === "/login") return renderLoginPage();
  if (state.route.path === "/register") return renderRegisterPage();
  if (state.route.path === "/verify-email") return renderVerifyEmailPage();
  if (state.route.path === "/tariffs") return renderTariffsPage();
  if (state.route.path === "/subscription") return renderSubscriptionPage();
  if (state.route.path === "/checkout") return renderCheckoutPage();
  if (state.route.path === "/stars") return renderStarsPage();
  if (state.route.path === "/payment-method") return renderPaymentMethodPage();
  if (state.route.path === "/confirm") return renderConfirmPage();
  if (state.route.path === "/payment-result") return renderPaymentResultPage();
  if (state.route.path === "/privacy") return renderPrivacyPage();
  if (state.route.path === "/offer") return renderOfferPage();
  return renderHomePage();
}

function requiresPortalSession(path) {
  return [
    "/subscription",
    "/checkout",
    "/stars",
    "/payment-method",
    "/confirm",
    "/payment-result",
  ].includes(path);
}

function renderShell(content, showSticky) {
  return `
    <div class="app-shell">
      ${renderStars()}
      <div class="container">
        <header class="topbar">
          <div class="topbar-inner">
            <a class="brand-mark" href="/" data-link aria-label="Таро Путь">
              ${renderBrandMark("brand-eye")}
            </a>
            <div class="brand-copy">
              <p class="brand-name">Таро Путь</p>
              <p class="account-line">${renderAccountLine()}</p>
            </div>
            <div class="topbar-actions">
              ${getPortalToken() || getAuthAccessToken()
                ? `<button class="topbar-link" type="button" data-action="logout">Выйти</button>`
                : `<a class="topbar-link" href="/login" data-link>Войти</a>`}
              <button class="icon-button" type="button" data-action="refresh-account" aria-label="Обновить">↻</button>
            </div>
          </div>
        </header>

        ${state.error ? `<section class="notice error">${escapeHtml(state.error)}</section>` : ""}
        ${state.notice ? `<section class="notice">${escapeHtml(state.notice)}</section>` : ""}
        ${content}

        <footer class="site-footer">
          <span>© 2026 Таро Путь</span>
          <a href="/privacy" data-link>Политика конфиденциальности</a>
          <a href="/offer" data-link>Оферта и реквизиты</a>
          <a href="mailto:vaapptaro@mail.ru">Поддержка</a>
        </footer>
      </div>
    </div>
  `;
}

function renderHomePage() {
  return `
    <main>
      <section class="hero">
        <p class="eyebrow">✦ Личный портал Таро Путь</p>
        <h1 class="page-title">Таро, профиль и подсказки в одном месте</h1>
        <p class="lead">
          Здесь можно узнать больше о приложении, посмотреть полезные подсказки,
          изучить возможности профиля и спокойно вернуться к нужному разделу.
        </p>
        <div class="hero-art" aria-hidden="true">
          <img class="hero-card hero-card-back" src="${cardBackUrl}" width="256" height="384" alt="" decoding="async" fetchpriority="high" />
          <img class="hero-card hero-card-front" src="${cardFrontUrl}" width="239" height="384" alt="" decoding="async" fetchpriority="high" />
          ${renderBrandMark("hero-symbol")}
        </div>
      </section>

      <section class="section panel">
        <h2 class="section-title">Что такое Таро Путь</h2>
        <p class="section-copy">
          Таро Путь помогает мягко разбирать вопросы через карты: выбрать тему, сформулировать
          запрос, открыть расклад и получить спокойную AI-трактовку без фатальности и страха.
          Это не обещание будущего, а личное пространство, где можно увидеть ситуацию
          под другим углом и сохранить важные наблюдения.
        </p>
      </section>

      <section class="section">
        <h2 class="section-title">Для каких устройств</h2>
        <div class="grid two">
          ${renderFeature("✓", "Android уже доступен", "Основной фокус сейчас на Android-версии приложения, личном профиле и удобном возвращении к своим раскладам.")}
          ${renderFeature("⌁", "iOS в разработке", "Версия для iPhone готовится к будущему выпуску в App Store.")}
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">Почему стоит открыть приложение</h2>
        <div class="grid">
          ${renderFeature("78", "Полная колода", "Старшие и младшие арканы, прямые и перевёрнутые позиции, разные размеры раскладов.")}
          ${renderFeature("AI", "Трактовка под вопрос", "Ответ строится по выбранной теме, вопросу и выпавшим картам, а не по шаблону.")}
          ${renderFeature("⌁", "Профиль и история", "В личном пространстве удобно смотреть сохранённые расклады, статистику и свой путь в приложении.")}
        </div>
      </section>

      <section class="section panel">
        <h2 class="section-title">Как пользоваться раскладами</h2>
        <div class="steps">
          ${renderStep("Выберите тему", "Любовь, работа, финансы, личное или свободный вопрос.")}
          ${renderStep("Сформулируйте запрос", "Лучше задавать вопрос так, чтобы ответ помог принять решение или увидеть динамику.")}
          ${renderStep("Перемешайте и откройте карты", "Приложение выберет карты и передаст их на трактовку.")}
          ${renderStep("Прочитайте результат", "Сохраните расклад в историю и вернитесь к нему позже, когда появятся новые наблюдения.")}
        </div>
      </section>

      ${renderSupportSection()}
      ${renderHomeActions()}
    </main>
  `;
}

function renderTariffsPage() {
  return `
    <main>
      ${renderPageIntro("Тарифы", "Выберите срок подписки Plus. На этой странице указаны актуальные цены и состав каждого предложения.")}
      <section class="section plans">
        ${plans.map((plan) => renderPlanCard(plan)).join("")}
      </section>

      <section class="section panel">
        <h2 class="section-title">Можно купить только звёзды</h2>
        <p class="section-copy">
          Если подписка пока не нужна, пополните баланс звёзд отдельно и используйте их
          на расклады в приложении.
        </p>
        <div class="actions">
          <button class="button secondary" type="button" data-action="stars-only">Купить звёзды отдельно</button>
        </div>
      </section>

      <section class="section panel">
        <h2 class="section-title">Способы оплаты</h2>
        <p class="section-copy">
          Оплата проходит через YooKassa. Банковская карта вводится только на защищённой
          стороне платёжного провайдера; портал создаёт заказ и перенаправляет на оплату.
        </p>
      </section>

      ${renderSupportSection()}
    </main>
  `;
}

function renderSubscriptionPage() {
  const selectedPlan = getSelectedPlan();
  const active = isSubscriptionActive();

  return `
    <main>
      ${renderPageIntro("Подписка", "Проверьте состояние доступа и продолжите оформление выбранного тарифа.")}
      <section class="section status-card">
        <div class="status-mark">${active ? "✓" : "!"}</div>
        <h2>${active ? "Ваша подписка активна" : "Ваша подписка не активна"}</h2>
        <p>
          ${
            active
              ? `Доступ Plus действует до ${formatDate(state.me.subscriptionExpiresAt)}.`
              : "Оформите подписку, чтобы пользоваться расширенными раскладами, историей, статистикой и регулярными начислениями звёзд."
          }
        </p>
      </section>

      ${active && state.me.subscription ? renderAutoRenewControl(state.me.subscription) : ""}

      <section class="section panel">
        <div class="summary-row">
          <span class="summary-label">Выбранный тариф</span>
          <span class="summary-value">${selectedPlan.title}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Звёзд в тарифе</span>
          <span class="summary-value">${selectedPlan.stars} ✦</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Стоимость</span>
          <span class="summary-value">${formatMoney(selectedPlan.price)}</span>
        </div>
      </section>

      ${renderPlusBenefits()}

      <section class="actions">
        <button class="button" type="button" data-action="buy-subscription">Купить подписку</button>
        <a class="button secondary" href="/tariffs" data-link>Вернуться к тарифам</a>
      </section>
    </main>
  `;
}

function renderCheckoutPage() {
  const selectedPlan = getSelectedPlan();
  const selectedPack = getSelectedStarPack();

  return `
    <main>
      ${renderPageIntro("Купить подписку", "Выберите срок подписки и пакет звёзд. Оплата будет запущена только после подтверждения способа оплаты.")}

      <section class="section">
        <h2 class="section-title">Срок подписки</h2>
        <div class="choice-grid">
          ${plans
            .map(
              (plan) => `
                <button class="choice ${plan.code === selectedPlan.code ? "is-selected" : ""}" type="button" data-action="checkout-plan" data-plan="${plan.code}">
                  <strong>${plan.title}</strong>
                  <span>${formatMoney(plan.price)} · ${plan.stars} ✦ / мес</span>
                </button>
              `
            )
            .join("")}
        </div>
      </section>

      ${renderPlusBenefits()}

      <section class="section">
        <h2 class="section-title">Пакет звёзд</h2>
        <div class="choice-grid">
          ${starPacks
            .map(
              (pack) => `
                <button class="choice ${pack.code === selectedPack.code ? "is-selected" : ""}" type="button" data-action="checkout-stars" data-stars="${pack.code}">
                  <strong>${pack.title}</strong>
                  <span>${pack.price === 0 ? "не добавлять" : formatMoney(pack.price)}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="section panel">
        ${renderCheckoutSummary()}
      </section>

      <section class="actions">
        <button class="button" type="button" data-action="continue-to-method">Продолжить</button>
      </section>
    </main>
  `;
}

function renderStarsPage() {
  const selectedPack = getSelectedStarPack();

  return `
    <main>
      ${renderPageIntro("Купить звёзды", "Выберите пакет звёзд без оформления подписки. Звёзды можно потратить на расклады в приложении.")}

      <section class="section">
        <h2 class="section-title">Пакет звёзд</h2>
        <div class="choice-grid">
          ${starPacks
            .filter((pack) => pack.code !== "none")
            .map(
              (pack) => `
                <button class="choice ${pack.code === selectedPack.code ? "is-selected" : ""}" type="button" data-action="stars-pack" data-stars="${pack.code}">
                  <strong>${pack.title}</strong>
                  <span>${formatMoney(pack.price)}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="section panel">
        ${renderCheckoutSummary()}
      </section>

      <section class="actions">
        <button class="button" type="button" data-action="continue-to-method">Продолжить</button>
        <a class="button secondary" href="/tariffs" data-link>Вернуться к тарифам</a>
      </section>
    </main>
  `;
}

function renderPaymentMethodPage() {
  const isStarsOnly = state.checkout.planCode === "none";

  return `
    <main>
      ${renderPageIntro("Выберите способ оплаты", isStarsOnly ? "Оплата отдельного пакета звёзд пройдёт через YooKassa." : "Сейчас доступна оплата банковской картой через YooKassa.")}

      <section class="section">
        <button class="choice is-selected" type="button" data-action="select-method" data-method="bank_card">
          <strong>Банковская карта</strong>
          <span>Visa, Mastercard, Мир и другие способы, доступные на стороне YooKassa.</span>
        </button>
      </section>

      <section class="section notice">
        Данные карты не вводятся на этой странице. После подтверждения мы перенаправим вас
        на защищённую страницу YooKassa.
      </section>
    </main>
  `;
}

function renderConfirmPage() {
  const selectedPlan = getSelectedPlan();
  const isStarsOnly = state.checkout.planCode === "none";

  return `
    <main>
      ${renderPageIntro("Оформление подписки", "Проверьте покупку и перейдите к защищённой оплате.")}

      <section class="section panel">
        ${renderCheckoutSummary()}
      </section>

      ${
        isStarsOnly
          ? ""
          : `
            <section class="section">
              <label class="renewal-consent">
                <input
                  type="checkbox"
                  data-action="toggle-checkout-auto-renew"
                  ${state.checkout.autoRenewEnabled ? "checked" : ""}
                />
                <span>
                  <strong>Включить автоматическое продление</strong>
                  <small>
                    Разрешаю сохранить способ оплаты и списывать ${formatMoney(selectedPlan.price)}
                    каждые ${selectedPlan.months} ${getMonthWord(selectedPlan.months)}.
                    Не менее чем за три дня до списания мне направят уведомление на email.
                    Автопродление можно отключить в личном кабинете до следующего списания.
                  </small>
                </span>
              </label>
            </section>
          `
      }

      <section class="section notice">
        После нажатия кнопки откроется защищённая страница оплаты. Когда платёж будет
        завершён, статус подписки и баланс обновятся автоматически.
      </section>

      <section class="actions">
        <button class="button" type="button" data-action="create-payment">Перейти к оплате</button>
        <a class="button secondary" href="/payment-method" data-link>Назад к способам оплаты</a>
      </section>
      <p class="checkout-legal-note">
        Нажимая «Перейти к оплате», вы принимаете условия
        <a href="/offer" data-link>публичной оферты</a> редакции ${LEGAL_DOCUMENT_VERSION} и подтверждаете, что ознакомились
        с <a href="/privacy" data-link>политикой конфиденциальности</a>.
      </p>
    </main>
  `;
}

function renderPaymentResultPage() {
  const active = isSubscriptionActive();
  const starsBalance = state.me?.starsBalance ?? 0;

  return `
    <main>
      ${renderPageIntro("Возврат после оплаты", "Мы вернули вас в портал Таро Путь. Если платёж уже обработан, статус обновится в личном кабинете.")}

      <section class="section status-card">
        <div class="status-mark">${active ? "✓" : "⌁"}</div>
        <h2>${active ? "Подписка активна" : "Платёж обрабатывается"}</h2>
        <p>
          ${
            active
              ? `Доступ Plus действует до ${formatDate(state.me.subscriptionExpiresAt)}. Баланс: ${starsBalance} ✦.`
              : `Если оплата прошла успешно, YooKassa скоро пришлёт подтверждение, а баланс и статус обновятся автоматически. Текущий баланс: ${starsBalance} ✦.`
          }
        </p>
      </section>

      <section class="actions">
        <button class="button" type="button" data-action="refresh-account">Обновить статус</button>
        <a class="button secondary" href="/" data-link>На главную</a>
      </section>
    </main>
  `;
}

function renderPlanCard(plan) {
  return `
    <article class="plan">
      <div class="plan-top">
        <div>
          <h3>${plan.title}</h3>
          <p>${plan.description}</p>
        </div>
        <div class="price">${formatMoney(plan.price)}</div>
      </div>
      <p class="badge">${plan.badge}</p>
      <ul class="list">
        <li>Plus-доступ на ${plan.months} ${getMonthWord(plan.months)}</li>
        <li>${plan.stars} звёзд каждый месяц</li>
        <li>История, статистика и расширенные расклады</li>
        <li>Доступ к профилю, статистике и будущему разделу гороскопа</li>
      </ul>
      <div class="actions">
        <button class="button" type="button" data-action="select-plan" data-plan="${plan.code}">Подключить</button>
      </div>
    </article>
  `;
}

function renderCheckoutSummary() {
  const selectedPlan = getSelectedPlan();
  const selectedPack = getSelectedStarPack();
  const isStarsOnly = state.checkout.planCode === "none";
  const planPrice = isStarsOnly ? 0 : selectedPlan.price;
  const total = planPrice + selectedPack.price;

  return `
    ${
      isStarsOnly
        ? `
          <div class="summary-row">
            <span class="summary-label">Покупка</span>
            <span class="summary-value">Только звёзды</span>
          </div>
        `
        : `
          <div class="summary-row">
            <span class="summary-label">Подписка</span>
            <span class="summary-value">${selectedPlan.title} · ${formatMoney(selectedPlan.price)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Звёзды в тарифе</span>
            <span class="summary-value">${selectedPlan.stars} ✦ каждый месяц</span>
          </div>
        `
    }
    <div class="summary-row">
      <span class="summary-label">${isStarsOnly ? "Пакет звёзд" : "Дополнительный пакет"}</span>
      <span class="summary-value">${selectedPack.title} · ${formatMoney(selectedPack.price)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Итого</span>
      <span class="summary-value">${formatMoney(total)}</span>
    </div>
  `;
}

function renderAutoRenewControl(subscription) {
  const enabled = subscription.autoRenewEnabled === true;
  const nextCharge = enabled && subscription.nextChargeAt
    ? `Следующее списание: ${formatDate(subscription.nextChargeAt)}.`
    : "Новых автоматических списаний не будет.";

  return `
    <section class="section renewal-control">
      <div>
        <h2 class="section-title">Автопродление</h2>
        <p class="section-copy">${nextCharge}</p>
      </div>
      ${enabled
        ? `<button
            class="renewal-switch is-on"
            type="button"
            role="switch"
            aria-checked="true"
            aria-label="Отключить автоматическое продление"
            data-action="toggle-auto-renew"
            data-enabled="false"
          ><span></span></button>`
        : `<a class="button secondary" href="/checkout" data-link>Оформить заново с автопродлением</a>`}
    </section>
  `;
}

function renderPlusBenefits() {
  return `
    <section class="section panel">
      <h2 class="section-title">Что даёт подписка</h2>
      <ul class="list">
        <li>Доступ к профилю и расширенной статистике в профиле</li>
        <li>История раскладов и удобное возвращение к прошлым трактовкам</li>
        <li>Гороскоп сейчас находится в разработке и будет доступен по подписке</li>
      </ul>
    </section>
  `;
}

function renderSupportSection() {
  return `
    <section class="section panel">
      <h2 class="section-title">Остались вопросы?</h2>
      <p class="section-copy">
        Напишите нам, если нужна помощь со входом, подпиской или оплатой.
      </p>
      <div class="footer-links" style="margin-top: 14px">
        <a class="support-link" href="mailto:vaapptaro@mail.ru">vaapptaro@mail.ru <span>→</span></a>
      </div>
    </section>
  `;
}

function renderPrivacyPage() {
  const sections = [
    [
      "Общие положения и оператор",
      `Политика определяет порядок обработки персональных данных в приложении и на платёжном портале «Таро Путь». Оператор: ${sellerDetails.fullName}, ИНН ${sellerDetails.inn}, ${sellerDetails.status}. Контакт по вопросам данных: <a href="mailto:${sellerDetails.email}">${sellerDetails.email}</a>. Политика применяется к пользователям приложения, сайта и лицам, обращающимся в поддержку.`,
    ],
    [
      "Категории обрабатываемых данных",
      "Оператор может обрабатывать: email; nickname и знак зодиака; внутренний идентификатор аккаунта; сведения о подтверждении email и восстановлении доступа; идентификаторы внешней авторизации; вопросы пользователя, выбранные карты, результаты и историю раскладов; настройки и статистику использования; статус подписки, баланс и операции со звёздами; идентификаторы заказов и платежей, суммы, даты, статусы и технические ответы платёжного провайдера; даты и технические сведения о сессиях и обращениях. Пароль хранится только в виде стойкого хеша. Полные реквизиты банковской карты Оператор не получает и не хранит.",
    ],
    [
      "Цели и правовые основания",
      "Данные аккаунта и профиля обрабатываются для регистрации, аутентификации, защиты доступа и исполнения пользовательского запроса; вопросы и история — для формирования, выдачи и сохранения раскладов; платёжные сведения — для заключения и исполнения договора, учёта оплаты, начислений, возвратов и выполнения обязанностей по закону; контакты и обращения — для поддержки и защиты прав сторон; технические сведения — для безопасности, предотвращения злоупотреблений и диагностики сбоев. Основаниями являются заключение и исполнение договора, выполнение обязанностей, установленных законом, согласие пользователя в случаях, когда оно требуется, и законные интересы Оператора в обеспечении безопасности без нарушения прав пользователя.",
    ],
    [
      "Действия с данными и источники",
      "Оператор получает данные непосредственно от пользователя, из приложения и сайта при их использовании, а также от платёжного провайдера в связи с оплатой. Могут выполняться сбор, запись, систематизация, накопление, хранение, уточнение, извлечение, использование, передача уполномоченному обработчику, блокирование, обезличивание и уничтожение данных с использованием автоматизированных средств и без них.",
    ],
    [
      "Искусственный интеллект и трансграничная передача",
      "Для подготовки трактовки вопрос, выбранные карты и необходимый контекст передаются провайдеру API OpenAI. Такая обработка может выполняться с использованием инфраструктуры за пределами Российской Федерации. Передача осуществляется только для формирования ответа и при соблюдении применимых требований к трансграничной передаче. Не указывайте в вопросах паспортные, платёжные, медицинские и иные чувствительные сведения, а также данные третьих лиц без законного основания. Сервис не предназначен для обработки специальных категорий и биометрических персональных данных.",
    ],
    [
      "Платежи и иные обработчики",
      "Оплату проводит ООО НКО «ЮМани» через сервис ЮKassa, который самостоятельно обрабатывает платёжные данные по своим правилам. Для работы сервиса могут привлекаться поставщики хостинга, электронной почты, мониторинга и технической инфраструктуры. Им передаётся только объём данных, необходимый для соответствующей функции, на основании договора либо иного законного основания и при соблюдении требований конфиденциальности.",
    ],
    [
      "Локализация и сроки хранения",
      "Оператор обязан обеспечивать первичную запись, систематизацию, накопление, хранение, уточнение и извлечение персональных данных граждан Российской Федерации с использованием баз данных на территории Российской Федерации, кроме прямо предусмотренных законом случаев; сведения о фактическом размещении поддерживаются в уведомлении оператора. Данные аккаунта, профиля и история хранятся до удаления аккаунта или достижения цели обработки; коды и сессии — до истечения срока действия либо досрочного прекращения; сведения об оплатах, возвратах и обязательной отчётности — в течение сроков, установленных налоговым, гражданским и иным применимым законодательством. После удаления из рабочей базы сведения могут временно оставаться в резервных копиях до их планового перезаписывания; в этот период они не используются для обычной работы сервиса.",
    ],
    [
      "Защита данных",
      "Применяются разграничение доступа, хеширование паролей и токенов, HTTPS, журналирование значимых операций, резервное копирование, обновление программного обеспечения и контроль доступа к инфраструктуре. При инциденте Оператор принимает меры по прекращению нарушения, оценке последствий и уведомлению уполномоченного органа и пользователей в случаях и сроки, установленные законом.",
    ],
    [
      "Локальное хранилище и cookies",
      "Платёжный портал использует localStorage и sessionStorage для токенов входа, срока сессии, выбранного заказа и технических настроек. Эти данные нужны для работы авторизации и оформления оплаты и не используются для рекламного профилирования. Пользователь может очистить их средствами браузера, однако после этого потребуется повторный вход.",
    ],
    [
      "Права пользователя",
      `Пользователь вправе получить сведения об обработке, потребовать уточнения, блокирования или уничтожения данных, отозвать согласие, возразить против обработки, основанной на законном интересе, и обжаловать действия Оператора в Роскомнадзор или суд. Запрос направляется на <a href="mailto:${sellerDetails.email}">${sellerDetails.email}</a> с данными, позволяющими подтвердить принадлежность аккаунта. Ответ предоставляется в сроки, установленные законом. Отзыв согласия не влияет на законность обработки до его получения и не прекращает обработку, необходимую для исполнения закона или защиты требований сторон.`,
    ],
    [
      "Удаление аккаунта",
      `Удалить аккаунт можно в приложении: Профиль → Опасная зона → Удалить профиль и данные, либо направив запрос на <a href="mailto:${sellerDetails.email}">${sellerDetails.email}</a>. После удаления прекращаются сессии и автопродление, удаляются средства входа и внешние идентификаторы, а профиль и связанные данные обезличиваются или уничтожаются. Минимально необходимые сведения о платежах и операциях могут сохраняться отдельно в предусмотренных законом случаях. Удаление аккаунта не лишает пользователя права обратиться по поводу ошибочного списания или законного возврата.`,
    ],
    [
      "Возрастные ограничения",
      "Сервис предназначен для дееспособных лиц старше 18 лет. Оператор сознательно не собирает данные детей. Если станет известно, что данные несовершеннолетнего были предоставлены без надлежащего основания, они будут удалены после проверки обращения.",
    ],
    [
      "Обновление политики",
      `Актуальная редакция всегда размещена на этой странице. Существенные изменения применяются к последующей обработке с даты публикации, если закон не требует дополнительного уведомления или нового согласия. Редакция ${LEGAL_DOCUMENT_VERSION}.`,
    ],
  ];

  return `
    <main class="privacy-page">
      ${renderPageIntro("Политика обработки персональных данных", `Как приложение и платёжный портал «Таро Путь» работают с данными пользователей. Редакция ${LEGAL_DOCUMENT_VERSION}.`)}
      <section class="privacy-list">
        ${sections.map(([title, text], index) => `
          <article class="privacy-section">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>${title}</h2>
              <div class="legal-copy"><p>${text}</p></div>
            </div>
          </article>
        `).join("")}
      </section>
      <section class="privacy-contact">
        <p>Контакт по вопросам персональных данных</p>
        <a href="mailto:vaapptaro@mail.ru">vaapptaro@mail.ru</a>
      </section>
    </main>
  `;
}

function renderOfferPage() {
  const sections = [
    [
      "Общие положения",
      `Настоящий документ является публичной офертой в соответствии со статьёй 437 Гражданского кодекса Российской Федерации. Исполнитель — ${sellerDetails.fullName}, ${sellerDetails.status}, ИНН ${sellerDetails.inn}. Оферта адресована дееспособным физическим лицам старше 18 лет, приобретающим услуги для личных нужд (далее — «Заказчик»). Оплата выбранной услуги означает полное и безоговорочное принятие редакции оферты, показанной Заказчику до оплаты.`,
    ],
    [
      "Предмет договора",
      "Исполнитель предоставляет доступ к цифровому сервису «Таро Путь»: функциям приложения, AI-трактовкам раскладов, истории и статистике, подписке Plus и внутренним виртуальным единицам «звёзды». Конкретный состав заказа, срок доступа, количество звёзд, цена и наличие автопродления показываются до оплаты и являются частью договора.",
    ],
    [
      "Характер сервиса",
      "Материалы и AI-трактовки имеют исключительно информационно-развлекательный характер, не являются гарантированным предсказанием и не заменяют медицинскую, психологическую, юридическую, финансовую или иную профессиональную помощь. Сервис не предназначен для экстренных ситуаций. Заказчик самостоятельно оценивает материалы и принимает решения.",
    ],
    [
      "Предложения и цены",
      "Доступны подписки Plus на 1 месяц за 449 ₽, на 3 месяца за 1 190 ₽, на 6 месяцев за 2 190 ₽ и на 12 месяцев за 3 990 ₽. Каждая подписка включает 150 звёзд в месяц. Отдельно доступны пакеты: 50 звёзд за 199 ₽, 120 звёзд за 399 ₽, 300 звёзд за 899 ₽ и 750 звёзд за 1 990 ₽. Итоговая сумма показывается до оплаты. НДС не облагается в связи с применением Исполнителем режима НПД.",
    ],
    [
      "Оформление и оплата",
      `Для покупки Заказчик входит в аккаунт, выбирает предложение, проверяет заказ и переходит к оплате через ЮKassa. До перехода к оплате Заказчику доступны эта оферта и политика обработки персональных данных. Акцепт фиксируется с указанием времени, состава и суммы заказа и редакции оферты ${LEGAL_DOCUMENT_VERSION}. Платёжные данные карты вводятся на стороне ЮKassa; Исполнитель не получает полный номер карты, срок действия и код безопасности. Обязательство по оплате считается исполненным после подтверждения успешного платежа. Электронный чек передаётся Заказчику в порядке, предусмотренном законом.`,
    ],
    [
      "Получение услуги",
      "Физическая доставка не требуется. После подтверждения платежа подписка активируется, а приобретённые звёзды зачисляются автоматически в аккаунт, с которого оформлен заказ. Услуга непрерывного доступа оказывается в течение оплаченного периода. Услуга отдельного расклада считается оказанной после формирования результата и предоставления его в аккаунте; соответствующее количество звёзд считается использованным в этот момент. Зачисление звёзд подтверждается журналом операций. Если покупка не появилась после успешной оплаты, Заказчику следует обратиться в поддержку.",
    ],
    [
      "Подписка и автоматическое продление",
      "Подписка действует в течение выбранного оплаченного периода. Автопродление выключено по умолчанию и включается только отдельным, заранее не отмеченным флажком. Рядом с флажком указываются сумма и периодичность будущих списаний. Не менее чем за три дня до очередного списания Исполнитель направляет на email уведомление с суммой, датой и способом отказа. Отключение автопродления в личном кабинете является электронным отказом от использования сохранённого способа оплаты: новые платежи не инициируются, платёжный идентификатор удаляется, а доступ сохраняется до конца оплаченного периода. Повторное подключение возможно только через новую оплату и новое отдельное согласие. При изменении цены новая сумма не списывается без нового согласия Заказчика.",
    ],
    [
      "Звёзды",
      "Звёзды используются только внутри сервиса для получения обозначенных цифровых услуг. Они не являются денежными средствами или электронными деньгами, не приносят дохода и не передаются другим пользователям. Платные и бонусные начисления учитываются в журнале операций. Ограничение на обмен звёзд не отменяет право на возврат стоимости неиспользованного платного остатка в случаях, предусмотренных законом и настоящей офертой.",
    ],
    [
      "Отказ, возврат и ошибки платежа",
      `Заказчик вправе отказаться от договора в любое время с соблюдением обязательных норм законодательства, а от цифрового продукта надлежащего качества — также в течение семи дней, не считая дня покупки, в порядке и пределах, установленных обязательными правилами защиты потребителей. Для подписки с непрерывным доступом возврат рассчитывается пропорционально полным неиспользованным календарным дням оплаченного периода: стоимость периода умножается на число неиспользованных дней и делится на общее число дней периода. В предусмотренных законом случаях учитываются только фактически понесённые и подтверждённые расходы Исполнителя, непосредственно связанные с исполнением договора. Неиспользованные платные звёзды возвращаются пропорционально цене соответствующего пакета по данным журнала операций; бонусные звёзды денежной стоимости не имеют. Стоимость уже сформированных раскладов возврату не подлежит в той части, в которой услуга фактически оказана, если обязательные нормы закона не предусматривают иное. При ошибочном или повторном списании, неактивации покупки или недостатке услуги Заказчик вправе потребовать устранения нарушения либо возврата. Обращение направляется на ${sellerDetails.email} с email аккаунта и содержит дату, сумму и идентификатор платежа. Оно рассматривается не более 10 календарных дней; одобренный возврат выполняется тем же способом оплаты, если иной законный способ не согласован. Удаление аккаунта не является отказом от законных требований по ранее совершённому платежу.`,
    ],
    [
      "Права и обязанности сторон",
      "Исполнитель обязуется предоставить оплаченный доступ, обеспечить работу функций в разумных пределах, учитывать платежи и принимать обращения. Заказчик обязуется использовать собственный аккаунт, защищать данные входа, не нарушать работу сервиса, не выполнять автоматизированную выгрузку, не обходить ограничения и не использовать сервис незаконно или для нарушения прав других лиц.",
    ],
    [
      "Доступность и ограничение доступа",
      "Исполнитель может проводить технические работы и временно ограничивать функции для безопасности. При недоступности платного непрерывного доступа по вине Исполнителя более 24 часов подряд срок подписки продлевается на подтверждённый период недоступности либо производится соразмерный возврат по обращению Заказчика. Доступ может быть временно ограничен при признаках взлома, мошенничества, массовых автоматизированных запросов или иной угрозы; Заказчику предоставляется возможность обратиться в поддержку. Ограничение не отменяет обязательный возврат за неоказанную часть услуги.",
    ],
    [
      "Ответственность",
      "Стороны отвечают в соответствии с законодательством Российской Федерации. Исполнитель не отвечает за решения, принятые на основании развлекательных материалов, и за недоступность по причинам на стороне Заказчика, связи, магазина приложений, ЮKassa или иной независимой инфраструктуры, но рассматривает подтверждённые платежи и помогает восстановить доступ. Ничто в оферте не ограничивает обязательные права потребителя и ответственность, которую нельзя исключить договором.",
    ],
    [
      "Интеллектуальные права",
      "Программный код, дизайн, тексты, изображения и иные материалы охраняются законом и принадлежат Исполнителю или правообладателям. Заказчику предоставляется ограниченное право личного некоммерческого использования сервиса и полученных результатов. Перепродажа, массовое копирование, публикация закрытых материалов и создание производных сервисов без разрешения запрещены.",
    ],
    [
      "Персональные данные",
      "Персональные данные обрабатываются для регистрации, исполнения договора, формирования раскладов, платежей, поддержки, безопасности и выполнения закона. Вопрос и контекст расклада могут передаваться провайдеру AI. Заказчик обязуется не сообщать в вопросах чувствительные данные и данные третьих лиц без законного основания. Подробности, сроки хранения, получатели и права пользователя приведены в политике обработки персональных данных.",
    ],
    [
      "Обращения и споры",
      `Обращения принимаются по email ${sellerDetails.email}. Ответ предоставляется до 10 календарных дней, если законом не установлен иной срок. Претензионный порядок не является обязательным для потребителя, когда закон позволяет обратиться непосредственно в государственный орган или суд. Заказчик сохраняет право выбирать подсудность в предусмотренных законом случаях.`,
    ],
    [
      "Срок действия и изменения",
      `Оферта действует с момента размещения до отзыва или замены. Новая редакция применяется к будущим заказам. К уже оплаченному периоду и согласованным повторным списаниям применяется редакция ${LEGAL_DOCUMENT_VERSION}, принятая при оформлении, кроме обязательных изменений закона. Существенное изменение цены или условий автопродления требует нового согласия. Дата публикации этой редакции: 14 сентября 2026 года.`,
    ],
  ];

  return `
    <main class="legal-page">
      ${renderPageIntro("Публичная оферта", "Условия оказания цифровых услуг сервиса «Таро Путь», порядок оплаты, получения доступа и возврата средств.")}

      <section class="legal-summary" aria-label="Краткая информация об услуге">
        <div>
          <span>Исполнитель</span>
          <strong>${sellerDetails.fullName}</strong>
        </div>
        <div>
          <span>Статус</span>
          <strong>${sellerDetails.status}</strong>
        </div>
        <div>
          <span>ИНН</span>
          <strong>${sellerDetails.inn}</strong>
        </div>
        <div>
          <span>Получение заказа</span>
          <strong>Автоматически в аккаунте после оплаты</strong>
        </div>
      </section>

      <section class="privacy-list legal-list">
        ${sections.map(([title, text], index) => `
          <article class="privacy-section">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>${title}</h2>
              <p>${text}</p>
              ${title === "Персональные данные" ? '<p class="legal-inline-link"><a href="/privacy" data-link>Открыть политику конфиденциальности →</a></p>' : ""}
            </div>
          </article>
        `).join("")}
      </section>

      <section class="legal-requisites" id="requisites">
        <p class="eyebrow">Контакты и реквизиты</p>
        <h2 class="section-title">Исполнитель</h2>
        <dl>
          <div><dt>ФИО</dt><dd>${sellerDetails.fullName}</dd></div>
          <div><dt>Статус</dt><dd>${sellerDetails.status}</dd></div>
          <div><dt>ИНН</dt><dd>${sellerDetails.inn}</dd></div>
          <div><dt>Электронная почта</dt><dd><a href="mailto:${sellerDetails.email}">${sellerDetails.email}</a></dd></div>
        </dl>
      </section>
    </main>
  `;
}

function renderFeature(icon, title, text) {
  return `
    <article class="feature">
      <div class="feature-icon">${icon}</div>
      <div>
        <h3>${title}</h3>
        <p>${text}</p>
      </div>
    </article>
  `;
}

function renderStep(title, text) {
  return `
    <article class="step">
      <h3>${title}</h3>
      <p>${text}</p>
    </article>
  `;
}

function renderPageIntro(title, lead) {
  return `
    <section class="hero">
      <p class="eyebrow"><a href="/" data-link>← На главную</a></p>
      <h1 class="page-title">${title}</h1>
      <p class="lead">${lead}</p>
    </section>
  `;
}

function renderHomeActions() {
  if (!getPortalToken()) {
    return `
      <section class="section home-actions">
        <div class="home-actions-inner">
          <a class="button secondary" href="/login" data-link>Войти</a>
          <a class="button" href="/register" data-link>Зарегистрироваться</a>
        </div>
        <p class="tiny-link-note">После входа можно оформить подписку или купить звёзды.</p>
      </section>
    `;
  }

  return `
    <section class="section home-actions">
      <div class="home-actions-inner">
        <a class="button secondary" href="/subscription" data-link>Личный кабинет</a>
        <a class="button" href="/tariffs" data-link>Оформить подписку</a>
      </div>
    </section>
  `;
}

function renderLoginPage() {
  return `
    <main>
      ${renderPageIntro("Вход", "Войдите в аккаунт Таро Путь, чтобы оформить подписку или купить звёзды без перехода из приложения.")}
      <section class="section panel">
        <form class="auth-form" data-form="login">
          <label class="field">
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" required placeholder="you@example.com" />
          </label>
          <label class="field">
            <span>Пароль</span>
            <input name="password" type="password" autocomplete="current-password" required placeholder="Введите пароль" />
          </label>
          <button class="button" type="submit">Войти</button>
        </form>
        <p class="auth-switch">Нет аккаунта? <a href="/register" data-link>Зарегистрироваться</a></p>
      </section>
    </main>
  `;
}

function renderRegisterPage() {
  return `
    <main>
      ${renderPageIntro("Регистрация", "Создайте аккаунт Таро Путь. Если почта требует подтверждения, код можно будет ввести здесь же.")}
      <section class="section panel">
        <form class="auth-form" data-form="register">
          <label class="field">
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" required placeholder="you@example.com" />
          </label>
          <label class="field">
            <span>Пароль</span>
            <input name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="Придумайте пароль" />
          </label>
          <ul class="password-rules" aria-label="Требования к паролю">
            <li>не менее 8 символов</li>
            <li>заглавная и строчная буквы</li>
            <li>хотя бы одна цифра</li>
          </ul>
          <button class="button" type="submit">Зарегистрироваться</button>
        </form>
        <p class="auth-switch">Уже есть аккаунт? <a href="/login" data-link>Войти</a></p>
      </section>
    </main>
  `;
}

function renderVerifyEmailPage() {
  const email = sessionStorage.getItem(AUTH_PENDING_EMAIL_KEY) || getSearchParam("email") || "";

  return `
    <main>
      ${renderPageIntro("Подтверждение почты", "Введите код из письма, чтобы завершить вход и открыть оплату.")}
      <section class="section panel">
        <form class="auth-form" data-form="verify-email">
          <label class="field">
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" required value="${escapeHtml(email)}" />
          </label>
          <label class="field">
            <span>Код</span>
            <input name="code" type="text" inputmode="numeric" pattern="\\d{6}" maxlength="6" required placeholder="000000" />
          </label>
          <button class="button" type="submit">Подтвердить</button>
        </form>
        <p class="auth-switch">После подтверждения сайт автоматически откроет личный кабинет оплаты.</p>
      </section>
    </main>
  `;
}

function renderAuthRequiredPage() {
  return `
    <main>
      ${renderPageIntro("Войдите в аккаунт", "Чтобы продолжить оформление, войдите в аккаунт Таро Путь или создайте новый. После входа сайт вернёт вас к выбору тарифа и звёзд.")}
      <section class="section panel">
        <div class="actions">
          <a class="button" href="/login" data-link>Войти</a>
          <a class="button secondary" href="/register" data-link>Зарегистрироваться</a>
        </div>
      </section>
    </main>
  `;
}

function renderLoading() {
  return `
    <main class="loading">
      <div>
        <div class="spinner"></div>
        <p class="section-copy">Открываем портал...</p>
      </div>
    </main>
  `;
}

function renderAccountLine() {
  if (!getPortalToken()) {
    if (state.authUser?.email) {
      return `Вошли на сайте как: ${escapeHtml(state.authUser.email)}`;
    }

    return "Войдите на сайте или откройте ссылку из приложения";
  }

  if (!state.me) {
    return "Сессия портала активна";
  }

  const displayName =
    state.me.nickname ||
    state.me.email ||
    state.me.userName ||
    "пользователь";

  return `Вы вошли как: ${escapeHtml(displayName)} · ${state.me.starsBalance ?? 0} ✦`;
}

function renderStars() {
  return `
    <div class="stars" aria-hidden="true">
      ${Array.from({ length: 24 })
        .map((_, index) => {
          const left = (index * 23) % 97;
          const top = (index * 37) % 99;
          const size = index % 5 === 0 ? 3 : 2;
          const opacity = index % 3 === 0 ? 0.68 : 0.28;
          return `<span class="star" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px;opacity:${opacity}"></span>`;
        })
        .join("")}
    </div>
  `;
}

function navigate(path) {
  window.history.pushState(null, "", path);
  state.route = getRoute();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getRoute() {
  return {
    path: window.location.pathname === "/payment" ? "/" : window.location.pathname,
    search: window.location.search,
  };
}

function getSearchParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function getPortalToken() {
  return sessionStorage.getItem(PORTAL_TOKEN_STORAGE_KEY);
}

function getAuthAccessToken() {
  return localStorage.getItem(AUTH_ACCESS_TOKEN_STORAGE_KEY);
}

function getAuthRefreshToken() {
  return localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
}

function loadAuthUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function clearAuthState() {
  localStorage.removeItem(AUTH_ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  sessionStorage.removeItem(PORTAL_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(PORTAL_EXPIRES_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_PENDING_EMAIL_KEY);
  state.authUser = null;
}

function loadCheckoutState() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CHECKOUT_STATE_KEY) || "{}");
    return {
      planCode: parsed.planCode || getSearchParam("plan") || "plus_1m",
      starPackCode: parsed.starPackCode || getSearchParam("stars") || "none",
      paymentMethod: parsed.paymentMethod || "bank_card",
      // Согласие на рекуррентные списания никогда не восстанавливается
      // из прошлой попытки оформления: пользователь ставит флажок заново.
      autoRenewEnabled: false,
    };
  } catch {
    return {
      planCode: "plus_1m",
      starPackCode: "none",
      paymentMethod: "bank_card",
      autoRenewEnabled: false,
    };
  }
}

function setCheckoutState(nextState) {
  state.checkout = {
    ...state.checkout,
    ...nextState,
  };

  sessionStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify(state.checkout));
}

function getSelectedPlan() {
  const planCode = state.checkout.planCode || getSearchParam("plan");
  return plans.find((plan) => plan.code === planCode) || plans[0];
}

function getSelectedStarPack() {
  return (
    starPacks.find((pack) => pack.code === state.checkout.starPackCode) ||
    starPacks[0]
  );
}

function isSubscriptionActive() {
  if (!state.me) return false;
  if (state.me.subscriptionTier !== "Plus" && state.me.subscriptionTier !== "Premium") {
    return false;
  }

  if (!state.me.subscriptionExpiresAt) return true;

  return new Date(state.me.subscriptionExpiresAt).getTime() > Date.now();
}

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Запрос к серверу не выполнен.");
  }

  return data;
}

function getErrorMessage(error) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Не удалось выполнить действие.";
}

function isPasswordValid(password) {
  return (
    password.length >= 8 &&
    /[a-zа-яё]/u.test(password) &&
    /[A-ZА-ЯЁ]/u.test(password) &&
    /\d/u.test(password)
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  if (value === 0) return "0 ₽";
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getMonthWord(value) {
  if (value === 1) return "месяц";
  if (value >= 2 && value <= 4) return "месяца";
  return "месяцев";
}
