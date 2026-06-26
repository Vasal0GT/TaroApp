const API_BASE_STORAGE_KEY = "taro.portal.apiBaseUrl";
const PORTAL_TOKEN_STORAGE_KEY = "taro.portal.accessToken";
const PORTAL_EXPIRES_STORAGE_KEY = "taro.portal.expiresAt";
const CHECKOUT_STATE_KEY = "taro.portal.checkoutState";
const AUTH_ACCESS_TOKEN_STORAGE_KEY = "taro.portal.authAccessToken";
const AUTH_REFRESH_TOKEN_STORAGE_KEY = "taro.portal.authRefreshToken";
const AUTH_USER_STORAGE_KEY = "taro.portal.authUser";
const AUTH_PENDING_EMAIL_KEY = "taro.portal.pendingEmail";

const API_BASE_URL =
  localStorage.getItem(API_BASE_STORAGE_KEY) ||
  window.TARO_PORTAL_CONFIG?.apiBaseUrl ||
  "http://localhost:5000";

const logoUrl = "/assets/inner-icon.png";
const cardBackUrl = "/assets/card-back.png";
const cardFrontUrl = "/assets/card-front.png";

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
    setCheckoutState({ planCode: action.dataset.plan });
    navigate(`/subscription?plan=${encodeURIComponent(action.dataset.plan)}`);
  }

  if (actionName === "buy-subscription") {
    const planCode = getSearchParam("plan") || state.checkout.planCode || "plus_1m";
    setCheckoutState({ planCode });
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

  const accessToken = getAuthAccessToken();
  if (!accessToken) return;

  const response = await fetch(`${API_BASE_URL}/api/billing/portal-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await parseResponse(response);
  const portalUrl = new URL(data.url, window.location.origin);
  const linkToken = portalUrl.searchParams.get("t");

  if (!linkToken) {
    throw new Error("Сервер не вернул токен портала.");
  }

  await exchangePortalLinkToken(linkToken);
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
      }),
    });

    if (response.status === 404 && state.checkout.planCode === "plus_1m") {
      const fallback = await fetch(`${API_BASE_URL}/api/billing/portal/checkout/plus`, {
        method: "POST",
        headers: {
          "X-Billing-Portal-Token": token,
        },
      });

      const fallbackData = await parseResponse(fallback);
      window.location.href = fallbackData.confirmationUrl;
      return;
    }

    const data = await parseResponse(response);
    window.location.href = data.confirmationUrl;
  } catch (error) {
    state.error = getErrorMessage(error);
    render();
  }
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
  if (state.isBootstrapping) {
    app.innerHTML = renderShell(renderLoading(), false);
    return;
  }

  const content = renderRoute();
  app.innerHTML = renderShell(content, state.route.path === "/");
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
            <a class="brand-mark" href="/" data-link aria-label="Taro">
              <img src="${logoUrl}" alt="" onerror="this.remove(); this.parentNode.innerHTML='<span class=&quot;brand-fallback&quot;>✦</span>'" />
            </a>
            <div class="brand-copy">
              <p class="brand-name">Taro</p>
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
      </div>
    </div>
  `;
}

function renderHomePage() {
  return `
    <main>
      <section class="hero">
        <p class="eyebrow">✦ Личный портал Taro</p>
        <h1 class="page-title">Таро, профиль и подсказки в одном месте</h1>
        <p class="lead">
          Здесь можно узнать больше о приложении, посмотреть полезные подсказки,
          изучить возможности профиля и спокойно вернуться к нужному разделу.
        </p>
        <div class="hero-art" aria-hidden="true">
          <img class="hero-card hero-card-back" src="${cardBackUrl}" alt="" />
          <img class="hero-card hero-card-front" src="${cardFrontUrl}" alt="" />
          <img class="hero-symbol" src="${logoUrl}" alt="" />
        </div>
      </section>

      <section class="section panel">
        <h2 class="section-title">Что такое Taro</h2>
        <p class="section-copy">
          Taro помогает мягко разбирать вопросы через карты: выбрать тему, сформулировать
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
      ${renderPageIntro("Тарифы", "Выберите срок подписки Plus. Финальные суммы можно будет скорректировать перед подключением к боевой оплате.")}
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
  return `
    <main>
      ${renderPageIntro("Оформление подписки", "Проверьте покупку и перейдите к защищённой оплате.")}

      <section class="section panel">
        ${renderCheckoutSummary()}
      </section>

      <section class="section notice">
        После нажатия кнопки портал создаст платёж и откроет страницу YooKassa. Возврат
        результата оплаты обработает backend через webhook.
      </section>

      <section class="actions">
        <button class="button" type="button" data-action="create-payment">Перейти к оплате</button>
        <a class="button secondary" href="/payment-method" data-link>Назад к способам оплаты</a>
      </section>
    </main>
  `;
}

function renderPaymentResultPage() {
  const active = isSubscriptionActive();
  const starsBalance = state.me?.starsBalance ?? 0;

  return `
    <main>
      ${renderPageIntro("Возврат после оплаты", "Мы вернули вас в портал Taro. Если платёж уже обработан, статус обновится в личном кабинете.")}

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
        Напишите в поддержку. Контакты можно заменить перед публикацией на реальные почту и Telegram.
      </p>
      <div class="footer-links" style="margin-top: 14px">
        <a class="support-link" href="mailto:support@example.com">support@example.com <span>→</span></a>
        <a class="support-link" href="https://t.me/example_support" target="_blank" rel="noreferrer">Telegram поддержки <span>→</span></a>
      </div>
    </section>
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
      ${renderPageIntro("Вход", "Войдите в аккаунт Taro, чтобы оформить подписку или купить звёзды без перехода из приложения.")}
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
      ${renderPageIntro("Регистрация", "Создайте аккаунт Taro. Если почта требует подтверждения, код можно будет ввести здесь же.")}
      <section class="section panel">
        <form class="auth-form" data-form="register">
          <label class="field">
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" required placeholder="you@example.com" />
          </label>
          <label class="field">
            <span>Пароль</span>
            <input name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="Минимум 8 символов" />
          </label>
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
      ${renderPageIntro("Войдите в аккаунт", "Чтобы продолжить оформление, войдите в аккаунт Taro или создайте новый. После входа сайт вернёт вас к выбору тарифа и звёзд.")}
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
      ${Array.from({ length: 38 })
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
    };
  } catch {
    return {
      planCode: "plus_1m",
      starPackCode: "none",
      paymentMethod: "bank_card",
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
