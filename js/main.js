(() => {
  const ACCENT = "#0068f9";
  const QUESTIONS = [
    "Какие SKU не продаются, но затоварены?",
    "Сколько заработаем, продав остатки по себесу?",
    "На каких этапах закупка–продажа заморожены деньги?",
    "На отгрузках с каких ФФ много возвратов?",
    "Насколько поднять цены, но не потерять объем?",
    "Какой фактический ДРР к прогнозному объему выкупов в ₽?",
    "По каким товарам не выполняем цели по марже?",
  ];
  const SLOT_TIMES = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  const state = {
    billing: "year",
    slotOpen: false,
    slotNow: false,
    slotDay: null,
    slotTime: null,
  };

  /* Mobile menu */
  const menuBtn = document.getElementById("menu-btn");
  const mobileNav = document.getElementById("mobile-nav");
  menuBtn?.addEventListener("click", () => {
    mobileNav.classList.toggle("is-open");
  });
  mobileNav?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => mobileNav.classList.remove("is-open"));
  });

  /* Hero questions rotation: 1s fade out · swap · 1s fade in · 2s hold */
  const title = document.getElementById("hero-title");
  let qIdx = 0;
  if (title) {
    setInterval(() => {
      title.classList.add("is-fading");
      setTimeout(() => {
        qIdx = (qIdx + 1) % QUESTIONS.length;
        title.textContent = QUESTIONS[qIdx];
        title.classList.remove("is-fading");
      }, 1000);
    }, 4000);
  }

  /* Pricing */
  function px(base, monthly) {
    const n = monthly ? Math.round((base * 1.15) / 1000) * 1000 : base;
    return n.toLocaleString("ru-RU").replace(/,/g, " ") + " ₽";
  }

  function renderPlans() {
    const monthly = state.billing === "month";
    const plans = [
      {
        name: "Старт",
        tag: "SaaS",
        price: px(49000, monthly),
        note: "ежемесячно · до 1 000 заказов / день",
        summary: "Для перехода с FBO на первом складе",
        features: [
          "2 маркетплейса и 1 склад",
          "Очередь заказов и волны сборки",
          "Пакетная печать ярлыков и ЧЗ",
          "Контроль сроков отгрузки",
          "Поддержка по почте",
        ],
        cta: "Подключить",
        hot: false,
        dark: false,
      },
      {
        name: "Рост",
        tag: "SaaS",
        price: px(149000, monthly),
        note: "ежемесячно · до 5 000 заказов / день",
        summary: "Для мультиканальных продавцов с несколькими складами.",
        features: [
          "Все маркетплейсы и склады",
          "Адресное хранение и терминалы сбора",
          "Интеграции с 1С, WMS и перевозчиками",
          "Аналитика цикла заказа и SLA",
          "Выделенный менеджер, SLA 4 часа",
        ],
        cta: "Подключить",
        hot: true,
        dark: false,
      },
      {
        name: "OnPremise",
        tag: "Enterprise",
        price: "от 1,2 млн ₽",
        note: "бессрочная лицензия + поддержка",
        summary: "Развёртывание в вашем контуре, данные не покидают периметр.",
        features: [
          "Установка в закрытом контуре",
          "SSO, ролевая модель, аудит действий",
          "Доработки под ваши процессы",
          "Обновления и сопровождение",
          "SLA 24/7 и выезд на склад",
        ],
        cta: "Обсудить внедрение",
        hot: false,
        dark: true,
      },
    ];

    const root = document.getElementById("plans");
    if (!root) return;
    root.innerHTML = plans
      .map((pl) => {
        const cls = ["plan", pl.hot && "is-hot", pl.dark && "is-dark"].filter(Boolean).join(" ");
        const btnCls = pl.hot || pl.dark ? "btn btn-primary" : "btn btn-outline";
        return `
          <article class="${cls}">
            <div class="plan-top">
              <span class="plan-name">${pl.name}</span>
              <span class="plan-tag">${pl.tag}</span>
            </div>
            <div>
              <div class="plan-price">${pl.price}</div>
              <div class="plan-note">${pl.note}</div>
            </div>
            <p class="plan-summary">${pl.summary}</p>
            <ul class="plan-features">
              ${pl.features.map((f) => `<li>${f}</li>`).join("")}
            </ul>
            <a class="${btnCls}" href="#contact">${pl.cta}</a>
          </article>`;
      })
      .join("");
  }

  document.querySelectorAll("[data-billing]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.billing = btn.dataset.billing;
      document.querySelectorAll("[data-billing]").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderPlans();
    });
  });
  renderPlans();

  /* Slot picker */
  const slotTrigger = document.getElementById("slot-trigger");
  const slotPanel = document.getElementById("slot-panel");
  const slotLabel = document.getElementById("slot-label");
  const slotDays = document.getElementById("slot-days");
  const slotTimes = document.getElementById("slot-times");
  const nowBtn = document.getElementById("now-btn");

  function slotDayList() {
    const dows = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
    const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        idx: i,
        dow: i === 0 ? "сегодня" : dows[d.getDay()],
        day: d.getDate(),
        month: months[d.getMonth()],
      };
    });
  }

  function slotText() {
    if (state.slotNow) return "Прямо сейчас";
    if (state.slotDay === null && !state.slotTime) return "Выбрать дату и время";
    const d = slotDayList()[state.slotDay === null ? 0 : state.slotDay];
    return d.day + " " + d.month + (state.slotTime ? ", " + state.slotTime : "");
  }

  function updateSlotUI() {
    const text = slotText();
    slotLabel.textContent = text;
    slotTrigger.classList.toggle("has-value", state.slotNow || state.slotDay !== null);
    nowBtn.classList.toggle("is-active", state.slotNow);
    slotPanel.classList.toggle("is-open", state.slotOpen);

    slotDays.innerHTML = slotDayList()
      .map(
        (d) => `
      <button type="button" class="day-btn${state.slotDay === d.idx ? " is-active" : ""}" data-day="${d.idx}">
        <small>${d.dow}</small><strong>${d.day}</strong>
      </button>`
      )
      .join("");

    slotTimes.innerHTML = SLOT_TIMES.map(
      (t) =>
        `<button type="button" class="time-btn${state.slotTime === t ? " is-active" : ""}" data-time="${t}">${t}</button>`
    ).join("");
  }

  slotTrigger?.addEventListener("click", () => {
    state.slotOpen = !state.slotOpen;
    updateSlotUI();
  });
  nowBtn?.addEventListener("click", () => {
    state.slotNow = true;
    state.slotDay = null;
    state.slotTime = null;
    state.slotOpen = false;
    updateSlotUI();
  });
  document.getElementById("slot-reset")?.addEventListener("click", () => {
    state.slotNow = false;
    state.slotDay = null;
    state.slotTime = null;
    updateSlotUI();
  });
  document.getElementById("slot-done")?.addEventListener("click", () => {
    state.slotOpen = false;
    updateSlotUI();
  });
  slotDays?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-day]");
    if (!btn) return;
    state.slotDay = Number(btn.dataset.day);
    state.slotNow = false;
    updateSlotUI();
  });
  slotTimes?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-time]");
    if (!btn) return;
    state.slotTime = btn.dataset.time;
    state.slotNow = false;
    if (state.slotDay === null) state.slotDay = 0;
    updateSlotUI();
  });
  document.addEventListener("click", (e) => {
    if (!state.slotOpen) return;
    if (e.target.closest(".slot-wrap")) return;
    state.slotOpen = false;
    updateSlotUI();
  });
  updateSlotUI();

  /* Form submit */
  document.getElementById("submit-btn")?.addEventListener("click", () => {
    const phone = document.getElementById("phone");
    const err = document.getElementById("phone-error");
    if (!phone.value.trim()) {
      phone.classList.add("is-error");
      err.classList.add("is-visible");
      return;
    }
    document.getElementById("form-body").classList.add("is-hidden");
    document.getElementById("form-success").classList.add("is-visible");
  });
  document.getElementById("phone")?.addEventListener("input", (e) => {
    e.target.classList.remove("is-error");
    document.getElementById("phone-error").classList.remove("is-visible");
  });
})();
