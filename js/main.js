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
    moneyScope: "all",
    moneyUnit: "money",
    status: { purchase: null, sale: null, product: null },
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

  /* Money and goods bar */
  const MONEY_COLORS = ["#1a73f9", "#f0a020", "#12b981", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#2563eb", "#84cc16", "#ec4899", "#0ea5e9"];
  const MONEY_ALL = {
    money: [2.7, 2.1, 1.8, 1.5, 1.2, 0.9, 0.42, 0.37, 0.27, 0.23, 0.25],
    pcs: [1840, 1420, 1210, 980, 810, 640, 220, 190, 150, 130, 160],
  };
  const MONEY_OWN = {
    money: [1.9, 1.4, 1.1, 0.9, 0.7, 0.5, 0.18, 0.21, 0.16, 0.12, 0.15],
    pcs: [1260, 940, 780, 610, 480, 360, 90, 110, 90, 70, 95],
  };
  const MONEY_DATA = {
    all: MONEY_ALL,
    own: MONEY_OWN,
    consign: {
      money: MONEY_ALL.money.map((v, i) => Math.round((v - MONEY_OWN.money[i]) * 100) / 100),
      pcs: MONEY_ALL.pcs.map((v, i) => v - MONEY_OWN.pcs[i]),
    },
  };

  function statusScale() {
    return ["purchase", "sale", "product"].reduce((scale, key) => {
      const value = state.status[key];
      if (value == null) return scale;
      return scale * (0.74 + Number(value) * 0.07);
    }, 1);
  }

  const MONEY_LABELS = [
    "На счете",
    "К выводу",
    "На балансе",
    "В пути к клиентам",
    "В отгрузке с ФФ",
    "Комплект.ФФ",
    "Потери",
    "Возвраты",
    "На ФФ",
    "Едет на склад ФФ",
    "Заказано",
  ];
  const SCOPE_LABELS = {
    all: "Все",
    own: "Свой товар",
    consign: "Под реализацию",
  };

  function scaledMoney(unit) {
    const scale = statusScale();
    return MONEY_DATA[state.moneyScope][unit].map((raw) => (
      unit === "money"
        ? Math.round(raw * scale * 10) / 10
        : Math.round(raw * scale)
    ));
  }

  function formatMoneySeg(value, unit, max) {
    if (value <= 0 || max <= 0 || value < max * 0.33) return "";
    if (unit === "money") return value.toFixed(1).replace(".", ",");
    return String(Math.round(value));
  }

  function placeFixedTooltip(anchor, tooltip) {
    const box = anchor.getBoundingClientRect();
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    const gap = 10;
    const pad = 8;
    let x = box.left + box.width / 2 - tw / 2;
    let y = box.top - th - gap;
    if (y < pad) y = box.bottom + gap;
    if (x < pad) x = pad;
    if (x + tw > window.innerWidth - pad) x = Math.max(pad, window.innerWidth - tw - pad);
    if (y + th > window.innerHeight - pad) y = Math.max(pad, window.innerHeight - th - pad);
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
  }

  function fillMoneyBar(bar, unit) {
    if (!bar) return;
    const values = scaledMoney(unit);
    const max = Math.max(...values, 0);
    bar.querySelectorAll(".money-seg").forEach((seg, i) => {
      const value = values[i] ?? 0;
      seg.style.flexGrow = String(Math.max(value, 0.01));
      seg.style.background = MONEY_COLORS[i];
      seg.textContent = formatMoneySeg(value, unit, max);
    });
  }

  function renderMoneyBar() {
    const chart = document.getElementById("money-chart");
    const dual = state.moneyUnit === "pcs";
    chart?.classList.toggle("is-dual", dual);
    document.querySelectorAll(".axis-btn[data-unit]").forEach((el) => {
      const on = dual || el.dataset.unit === state.moneyUnit;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    fillMoneyBar(document.getElementById("money-bar"), "money");
    if (dual) fillMoneyBar(document.getElementById("pcs-bar"), "pcs");
  }

  document.querySelectorAll(".filter-row [data-scope]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.moneyScope = btn.dataset.scope;
      document.querySelectorAll(".filter-row [data-scope]").forEach((el) => {
        const on = el === btn;
        el.classList.toggle("chip-dark", on);
        el.setAttribute("aria-pressed", on ? "true" : "false");
      });
      renderMoneyBar();
    });
  });

  document.querySelectorAll(".axis-btn[data-unit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.moneyUnit = btn.dataset.unit;
      renderMoneyBar();
    });
  });

  renderMoneyBar();

  (function initMoneyTooltips() {
    const tooltip = document.getElementById("money-tooltip");
    if (!tooltip) return;
    document.body.appendChild(tooltip);
    tooltip.classList.add("is-fixed");

    function bind(bar, unit) {
      if (!bar) return;
      bar.querySelectorAll(".money-seg").forEach((seg, i) => {
        const show = () => {
          const money = scaledMoney("money");
          const pcs = scaledMoney("pcs");
          const moneyVal = money[i] ?? 0;
          const pcsVal = pcs[i] ?? 0;
          const total = (unit === "pcs" ? pcs : money).reduce((a, b) => a + b, 0);
          const part = unit === "pcs" ? pcsVal : moneyVal;
          const share = total > 0 ? Math.round((part / total) * 100) : 0;
          tooltip.innerHTML =
            "<strong>" + MONEY_LABELS[i] + "</strong>" +
            "<span>" + SCOPE_LABELS[state.moneyScope] + " · " + (unit === "money" ? "₽, млн" : "Шт.") + "</span>" +
            "<span>Сумма: " + moneyVal.toFixed(1).replace(".", ",") + " млн ₽</span>" +
            "<span>Количество: " + pcsVal.toLocaleString("ru-RU").replace(/,/g, " ") + " шт.</span>" +
            "<span>Доля: " + share + "%</span>";
          tooltip.classList.add("is-visible");
          placeFixedTooltip(seg, tooltip);
        };
        const hide = () => tooltip.classList.remove("is-visible");
        seg.addEventListener("mouseenter", show);
        seg.addEventListener("mouseleave", hide);
        seg.addEventListener("focus", show);
        seg.addEventListener("blur", hide);
        seg.tabIndex = 0;
      });
    }

    bind(document.getElementById("money-bar"), "money");
    bind(document.getElementById("pcs-bar"), "pcs");
  })();

  const statusFilters = document.querySelectorAll(".status-filter");
  function closeStatusFilters(except) {
    statusFilters.forEach((el) => {
      if (el === except) return;
      el.classList.remove("is-open");
      el.querySelector(".select-chip")?.setAttribute("aria-expanded", "false");
    });
  }
  statusFilters.forEach((filter) => {
    const trigger = filter.querySelector(".select-chip");
    const key = filter.dataset.filter;
    trigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !filter.classList.contains("is-open");
      closeStatusFilters();
      filter.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    filter.querySelector(".status-reset")?.addEventListener("click", (e) => {
      e.stopPropagation();
      filter.querySelectorAll(".status-option").forEach((el) => el.classList.remove("is-active"));
      state.status[key] = null;
      closeStatusFilters();
      renderMoneyBar();
    });
    filter.querySelectorAll(".status-option").forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        filter.querySelectorAll(".status-option").forEach((el) => el.classList.toggle("is-active", el === opt));
        state.status[key] = opt.dataset.value;
        closeStatusFilters();
        renderMoneyBar();
      });
    });
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".status-filter")) return;
    closeStatusFilters();
  });

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

  /* BCG assortment tooltips */
  const BCG_Q = {
    kids: { name: "Трудные дети", color: "#f0a020", hint: "Высокий рост рынка, низкая доля" },
    stars: { name: "Звёзды", color: "#2c5fd6", hint: "Высокий рост рынка, высокая доля" },
    dogs: { name: "Собаки", color: "#d63a35", hint: "Низкий рост рынка, низкая доля" },
    cows: { name: "Дойные коровы", color: "#1f7a35", hint: "Низкий рост рынка, высокая доля" },
  };

  function bcgQuadrantBox(qKey) {
    const isLeft = qKey === "kids" || qKey === "dogs";
    const isTop = qKey === "kids" || qKey === "stars";
    return {
      minL: (isLeft ? 0 : 50) + 5,
      maxL: (isLeft ? 50 : 100) - 5,
      minT: (isTop ? 0 : 50) + 16,
      maxT: (isTop ? 50 : 100) - 5,
    };
  }

  function bcgRng(seed) {
    return function () {
      seed |= 0;
      seed = seed + 0x6d2b79f5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function bcgScatterInQuadrant(qKey, count, rand) {
    const box = bcgQuadrantBox(qKey);
    const cols = 4;
    const rows = 3;
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) cells.push([c, r]);
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = cells[i];
      cells[i] = cells[j];
      cells[j] = tmp;
    }
    const w = box.maxL - box.minL;
    const h = box.maxT - box.minT;
    return cells.slice(0, count).map(([c, r]) => ({
      left: box.minL + ((c + 0.18 + rand() * 0.64) / cols) * w,
      top: box.minT + ((r + 0.18 + rand() * 0.64) / rows) * h,
      qKey,
      box,
    }));
  }

  function bcgLayoutPositions(items, matrix) {
    const rect = matrix.getBoundingClientRect();
    const W = Math.max(rect.width, 360);
    const H = Math.max(rect.height, 280);
    const minPx = 22;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const byQ = { kids: [], stars: [], dogs: [], cows: [] };
    items.forEach((row, i) => byQ[row[3]].push(i));

    const pts = new Array(items.length);
    Object.keys(byQ).forEach((qKey, qi) => {
      const idxs = byQ[qKey];
      const scattered = bcgScatterInQuadrant(qKey, idxs.length, bcgRng(90210 + qi * 97));
      idxs.forEach((itemIndex, k) => {
        pts[itemIndex] = scattered[k];
      });
    });

    for (let iter = 0; iter < 80; iter++) {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          if (pts[i].qKey !== pts[j].qKey) continue;
          let dx = ((pts[j].left - pts[i].left) / 100) * W;
          let dy = ((pts[j].top - pts[i].top) / 100) * H;
          let dist = Math.hypot(dx, dy);
          if (dist < 0.5) {
            const angle = (i + 1) * 2.399 + j * 1.618;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            dist = 0.5;
          }
          if (dist >= minPx) continue;
          const push = (minPx - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          pts[i].left -= (nx * push / W) * 100;
          pts[i].top -= (ny * push / H) * 100;
          pts[j].left += (nx * push / W) * 100;
          pts[j].top += (ny * push / H) * 100;
        }
      }
      pts.forEach((p) => {
        p.left = clamp(p.left, p.box.minL, p.box.maxL);
        p.top = clamp(p.top, p.box.minT, p.box.maxT);
      });
    }
    return pts;
  }

  function placeBelowTooltip(anchor, tooltip) {
    const box = anchor.getBoundingClientRect();
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    const gap = 8;
    const pad = 8;
    let x = box.left;
    let y = box.bottom + gap;
    if (x + tw > window.innerWidth - pad) x = Math.max(pad, window.innerWidth - tw - pad);
    if (x < pad) x = pad;
    if (y + th > window.innerHeight - pad) y = Math.max(pad, box.top - th - gap);
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
  }
  const BCG_ITEMS = [
    ["Полотенце 118", 29.1, 17.4, "kids", "Ozon", 17, 8, 751000],
    ["Набор ножей 92", 33.1, 43.7, "kids", "Wildberries", 14, 10, 428000],
    ["Чехол силиконовый 40", 45.1, 42.9, "kids", "Ozon", 15, 14, 196000],
    ["Органайзер 77", 18.0, 19.0, "kids", "Wildberries", 22, 6, 312000],
    ["Лампа LED 21", 42.0, 36.0, "kids", "Ozon", 16, 13, 540000],
    ["Коврик для йоги 09", 4.4, 22.5, "kids", "Wildberries", 20, 2, 184000],
    ["Термокружка 54", 28.5, 14.7, "kids", "Ozon", 24, 9, 267000],
    ["Контейнеры 33", 27.7, 11.9, "kids", "Wildberries", 25, 8, 219000],
    ["Плед флисовый 12", 27.2, 23.0, "kids", "Ozon", 19, 8, 388000],
    ["Щётка для обуви 08", 27.4, 36.7, "kids", "Wildberries", 16, 8, 94000],
    ["Держатель 19", 21.9, 21.0, "kids", "Ozon", 21, 7, 141000],
    ["Ножи набор 116", 59.5, 37.7, "stars", "Ozon", 17, 22, 4761000],
    ["Робот-пылесос Dreame D9", 79.3, 10.0, "stars", "Ozon", 26, 28, 8120000],
    ["Электросамокат Kugoo M4", 90.5, 29.3, "stars", "Wildberries", 18, 32, 6340000],
    ["Смартфон POCO X6 Pro", 55.0, 39.4, "stars", "Ozon", 15, 19, 5210000],
    ["Робот-пылесос Xiaomi S20", 73.2, 21.5, "stars", "Wildberries", 21, 25, 3890000],
    ["Электровелосипед Kugoo V1", 60.7, 10.0, "stars", "Ozon", 26, 21, 4470000],
    ["Ninebot F2 Plus", 86.6, 15.0, "stars", "Ozon", 23, 30, 2980000],
    ["Redmi Note 13 Pro", 78.2, 39.3, "stars", "Wildberries", 15, 27, 3560000],
    ["Kugoo C1 Pro", 67.2, 6.5, "stars", "Ozon", 28, 23, 2410000],
    ["Kugoo S3 Pro", 64.8, 42.9, "stars", "Wildberries", 14, 22, 1870000],
    ["Dreame L10s", 80.0, 28.7, "stars", "Ozon", 18, 28, 4120000],
    ["Кабель USB-C 05", 26.6, 69.2, "dogs", "Ozon", 8, 9, 62000],
    ["Плёнка защитная 11", 9.1, 63.9, "dogs", "Wildberries", 10, 3, 41000],
    ["Ремешок для часов 03", 36.4, 54.1, "dogs", "Ozon", 12, 12, 88000],
    ["Адаптер 20W", 25.8, 64.0, "dogs", "Wildberries", 9, 8, 73000],
    ["Наушники проводные 14", 42.6, 86.2, "dogs", "Ozon", 4, 14, 51000],
    ["Стикерпак 02", 13.3, 57.0, "dogs", "Wildberries", 11, 4, 27000],
    ["Чехол книжка 27", 45.4, 89.7, "dogs", "Ozon", 3, 15, 96000],
    ["Шнурок для бейджа", 17.0, 68.3, "dogs", "Wildberries", 8, 5, 18000],
    ["Подставка для ноутбука", 36.2, 56.6, "dogs", "Ozon", 12, 12, 134000],
    ["Салфетки для экрана", 11.7, 55.3, "dogs", "Wildberries", 12, 4, 22000],
    ["Кабель Lightning 07", 45.8, 68.7, "dogs", "Ozon", 8, 15, 79000],
    ["Электросамокат Ninebot F2", 81.0, 59.0, "cows", "Ozon", 11, 28, 5240000],
    ["Робот-пылесос Xiaomi S10", 91.0, 64.3, "cows", "Wildberries", 9, 32, 6810000],
    ["Kugoo V1 Max", 81.1, 79.5, "cows", "Ozon", 6, 28, 3920000],
    ["Смартфон Redmi Note 13", 60.4, 57.2, "cows", "Wildberries", 12, 21, 4180000],
    ["Kugoo M4 Pro 18Ah", 66.7, 58.7, "cows", "Ozon", 11, 23, 4730000],
    ["Xiaomi Vacuum S20", 60.0, 81.8, "cows", "Ozon", 5, 21, 2560000],
    ["Kugoo C1 Pro 11Ah", 63.0, 88.8, "cows", "Wildberries", 4, 22, 1980000],
    ["Ninebot KickScooter", 61.2, 82.7, "cows", "Ozon", 5, 21, 2210000],
    ["Dreame Bot Z10", 73.6, 65.9, "cows", "Wildberries", 9, 25, 3470000],
    ["Kugoo S3 Pro 350W", 72.4, 80.1, "cows", "Ozon", 6, 25, 1640000],
    ["POCO X6 12/512", 72.1, 56.1, "cows", "Wildberries", 12, 25, 3890000],
  ];

  function formatRub(n) {
    return n.toLocaleString("ru-RU").replace(/,/g, " ") + " ₽";
  }

  (function initBcg() {
    const matrix = document.querySelector(".bcg-matrix");
    const tooltip = document.getElementById("bcg-tooltip");
    if (!matrix || !tooltip) return;
    document.body.appendChild(tooltip);
    tooltip.classList.add("is-fixed");

    const laidOut = bcgLayoutPositions(BCG_ITEMS, matrix);

    BCG_ITEMS.forEach((row, i) => {
      const [name, , , qKey, mp, growth, share, revenue] = row;
      const { left, top } = laidOut[i];
      const q = BCG_Q[qKey];
      const dot = document.createElement("span");
      dot.className = "bcg-dot";
      dot.style.left = left + "%";
      dot.style.top = top + "%";
      dot.style.background = q.color;
      const item = {
        name,
        sku: "SKU-" + (10340 + i),
        quadrant: q.name,
        mp,
        growth: "+" + growth + "%",
        share: share + "%",
        revenue: formatRub(revenue),
      };
      const show = () => {
        matrix.querySelectorAll(".bcg-dot.is-active").forEach((el) => el.classList.remove("is-active"));
        dot.classList.add("is-active");
        tooltip.innerHTML =
          "<strong>" + item.name + "</strong>" +
          "<span>" + item.sku + " · " + item.quadrant + "</span>" +
          "<span>Маркетплейс: " + item.mp + "</span>" +
          "<span>Рост рынка: " + item.growth + "</span>" +
          "<span>Доля рынка: " + item.share + "</span>" +
          "<span>Выручка: " + item.revenue + "</span>";
        tooltip.classList.add("is-visible");
        const box = dot.getBoundingClientRect();
        const tw = tooltip.offsetWidth;
        const th = tooltip.offsetHeight;
        const gap = 10;
        const pad = 8;
        let x = box.left - tw - gap;
        let y = box.top + box.height / 2 - th / 2;
        if (x < pad) x = box.right + gap;
        if (x + tw > window.innerWidth - pad) {
          x = Math.max(pad, window.innerWidth - tw - pad);
        }
        if (y < pad) y = pad;
        if (y + th > window.innerHeight - pad) {
          y = Math.max(pad, window.innerHeight - th - pad);
        }
        tooltip.style.left = x + "px";
        tooltip.style.top = y + "px";
      };
      const hide = () => {
        dot.classList.remove("is-active");
        tooltip.classList.remove("is-visible");
      };
      dot.addEventListener("mouseenter", show);
      dot.addEventListener("mouseleave", hide);
      dot.addEventListener("focus", show);
      dot.addEventListener("blur", hide);
      dot.tabIndex = 0;
      matrix.appendChild(dot);
    });

    matrix.querySelectorAll(".bcg-q-label").forEach((label) => {
      const q = BCG_Q[label.dataset.q];
      if (!q) return;
      const show = () => {
        matrix.querySelectorAll(".bcg-dot.is-active").forEach((el) => el.classList.remove("is-active"));
        tooltip.innerHTML = "<strong>" + q.name + "</strong><span>" + q.hint + "</span>";
        tooltip.classList.add("is-visible");
        placeBelowTooltip(label, tooltip);
      };
      const hide = () => {
        tooltip.classList.remove("is-visible");
      };
      label.addEventListener("mouseenter", show);
      label.addEventListener("mouseleave", hide);
      label.addEventListener("focus", show);
      label.addEventListener("blur", hide);
    });
  })();

  const TM_ITEMS = {
    "SKU-0004": ["Kugoo M4 Pro 18Ah", "Высокий спрос", "Ozon", 4820, 5140000],
    "SKU-0025": ["Робот-пылесос Dreame D9", "Высокий спрос", "Ozon", 4150, 4410000],
    "SKU-0022": ["Электросамокат Kugoo M4", "Средний спрос", "Wildberries", 1980, 2180000],
    "SKU-0011": ["Смартфон POCO X6 Pro", "Средний спрос", "Ozon", 1760, 1910000],
    "SKU-0015": ["Ninebot F2 Plus", "Средний спрос", "Ozon", 1720, 1890000],
    "SKU-0008": ["Kugoo C1 Pro", "Высокий спрос", "Wildberries", 1690, 1910000],
    "SKU-0016": ["Redmi Note 13 Pro", "Высокий спрос", "Ozon", 1480, 1590000],
    "SKU-0003": ["Электровелосипед Kugoo V1", "Средний спрос", "Wildberries", 1410, 1540000],
    "SKU-0021": ["Робот-пылесос Xiaomi S20", "Средний спрос", "Ozon", 3960, 4220000],
    "SKU-0017": ["Kugoo S3 Pro", "Высокий спрос", "Wildberries", 1080, 1140000],
    "SKU-0013": ["Dreame L10s", "Средний спрос", "Ozon", 1360, 1450000],
    "SKU-0009": ["Смартфон Redmi Note 13", "Средний спрос", "Wildberries", 1240, 1320000],
    "SKU-0006": ["Kugoo V1 Max", "Высокий спрос", "Ozon", 3410, 3640000],
    "SKU-0018": ["Xiaomi Vacuum S20", "Средний спрос", "Ozon", 2280, 2450000],
    "SKU-0026": ["Kugoo C1 Pro 11Ah", "Средний спрос", "Wildberries", 890, 950000],
    "SKU-0024": ["Ninebot KickScooter", "Высокий спрос", "Ozon", 1210, 1320000],
    "SKU-0012": ["Dreame Bot Z10", "Средний спрос", "Wildberries", 1180, 1310000],
    "SKU-0001": ["POCO X6 12/512", "Высокий спрос", "Ozon", 1060, 1140000],
    "SKU-0002": ["Электросамокат Ninebot F2", "Средний спрос", "Wildberries", 3280, 3490000],
    "SKU-0029": ["Набор ножей 116", "Нишевый спрос", "Ozon", 1040, 1140000],
    "SKU-0030": ["Полотенце 118", "Прочее", "Wildberries", 970, 1040000],
    "SKU-0033": ["Лампа LED 21", "Средний спрос", "Ozon", 720, 770000],
    "SKU-0027": ["Термокружка 54", "Нишевый спрос", "Wildberries", 680, 730000],
  };

  function placeTooltip(anchor, host, tooltip) {
    const hostBox = host.getBoundingClientRect();
    const box = anchor.getBoundingClientRect();
    const pad = 8;
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    let x = box.right - hostBox.left + 8;
    let y = box.top - hostBox.top + box.height / 2 - th / 2;
    if (x + tw > hostBox.width - pad) x = box.left - hostBox.left - tw - 8;
    if (x < pad) x = pad;
    if (y < pad) y = pad;
    if (y + th > hostBox.height - pad) y = Math.max(pad, hostBox.height - th - pad);
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
  }

  (function initTreemap() {
    const treemap = document.querySelector(".treemap");
    const tooltip = document.getElementById("tm-tooltip");
    const host = treemap?.parentElement;
    if (!treemap || !tooltip || !host) return;

    treemap.querySelectorAll(".tm-cell").forEach((cell) => {
      const sku = cell.querySelector("strong")?.textContent.trim();
      const share = cell.querySelector("span")?.textContent.trim();
      const row = TM_ITEMS[sku];
      if (!sku || !row) return;
      const [name, category, mp, orders, revenue] = row;
      const show = () => {
        tooltip.innerHTML =
          "<strong>" + name + "</strong>" +
          "<span>" + sku + " · " + category + "</span>" +
          "<span>Маркетплейс: " + mp + "</span>" +
          "<span>Доля спроса: " + share + "</span>" +
          "<span>Заказы: " + orders.toLocaleString("ru-RU").replace(/,/g, " ") + "</span>" +
          "<span>Выручка: " + formatRub(revenue) + "</span>";
        tooltip.classList.add("is-visible");
        placeTooltip(cell, host, tooltip);
      };
      const hide = () => tooltip.classList.remove("is-visible");
      cell.addEventListener("mouseenter", show);
      cell.addEventListener("mouseleave", hide);
      cell.addEventListener("focus", show);
      cell.addEventListener("blur", hide);
      cell.tabIndex = 0;
    });
  })();

  (function initElasticTooltips() {
    const tooltip = document.getElementById("elastic-tooltip");
    const points = document.querySelectorAll(".elastic-point");
    if (!tooltip || !points.length) return;
    document.body.appendChild(tooltip);
    tooltip.classList.add("is-fixed");
    const total = [...points].reduce((sum, el) => sum + Number(el.dataset.revenue || 0), 0);

    points.forEach((point) => {
      const show = () => {
        const revenue = Number(point.dataset.revenue || 0);
        const share = total > 0 ? Math.round((revenue / total) * 100) : 0;
        tooltip.innerHTML =
          "<strong>" + point.dataset.name + "</strong>" +
          "<span>Кластер спроса</span>" +
          "<span>Выручка: " + formatRub(revenue) + "</span>" +
          "<span>SKU: " + point.dataset.sku + "</span>" +
          "<span>Маржа: " + point.dataset.margin + "%</span>" +
          "<span>Доля: " + share + "%</span>";
        tooltip.classList.add("is-visible");
        placeFixedTooltip(point.querySelector("i") || point, tooltip);
      };
      const hide = () => tooltip.classList.remove("is-visible");
      point.addEventListener("mouseenter", show);
      point.addEventListener("mouseleave", hide);
      point.addEventListener("focus", show);
      point.addEventListener("blur", hide);
      point.tabIndex = 0;
    });
  })();

  /* Form submit → POST /api/fbs-leads (WEEEK, тот же бэкенд что enterFBS) */
  const submitBtn = document.getElementById("submit-btn");
  const submitError = document.getElementById("submit-error");
  let formSending = false;

  function setSubmitError(message) {
    if (!submitError) return;
    if (message) {
      submitError.textContent = message;
      submitError.classList.add("is-visible");
    } else {
      submitError.textContent = "";
      submitError.classList.remove("is-visible");
    }
  }

  function setSubmitting(sending) {
    formSending = sending;
    if (!submitBtn) return;
    submitBtn.disabled = sending;
    submitBtn.textContent = sending ? "Отправка…" : "Отправить заявку";
    submitBtn.style.opacity = sending ? "0.7" : "";
    submitBtn.style.cursor = sending ? "wait" : "";
  }

  submitBtn?.addEventListener("click", async () => {
    if (formSending) return;
    const phone = document.getElementById("phone");
    const phoneErr = document.getElementById("phone-error");
    const consent = document.getElementById("consent");
    const consentErr = document.getElementById("consent-error");
    const phoneOk = Boolean(phone?.value.trim());
    const consentOk = Boolean(consent?.checked);
    setSubmitError("");
    if (!phoneOk) {
      phone.classList.add("is-error");
      phoneErr.classList.add("is-visible");
    }
    if (!consentOk) {
      consentErr.classList.add("is-visible");
    }
    if (!phoneOk || !consentOk) return;

    if (!window.FbsForm || typeof window.FbsForm.submitLead !== "function") {
      setSubmitError("Не удалось отправить заявку. Попробуйте ещё раз.");
      return;
    }

    const hasPreferredTime = state.slotNow || state.slotDay !== null || Boolean(state.slotTime);
    setSubmitting(true);
    try {
      await window.FbsForm.submitLead({
        phone: phone.value.trim(),
        preferred_call_time: hasPreferredTime ? slotText() : "",
        consent: true,
        source: "eureka",
      });
      document.getElementById("form-body").classList.add("is-hidden");
      document.getElementById("form-success").classList.add("is-visible");
    } catch (error) {
      setSubmitError(
        error && error.message ? error.message : "Не удалось отправить заявку. Попробуйте ещё раз.",
      );
    } finally {
      setSubmitting(false);
    }
  });
  document.getElementById("phone")?.addEventListener("input", (e) => {
    e.target.classList.remove("is-error");
    document.getElementById("phone-error").classList.remove("is-visible");
  });
  document.getElementById("consent")?.addEventListener("change", (e) => {
    if (e.target.checked) {
      document.getElementById("consent-error").classList.remove("is-visible");
    }
  });
})();
