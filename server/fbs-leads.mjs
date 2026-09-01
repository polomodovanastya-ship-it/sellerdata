import { createWeeekLeadTask, weeekConfig } from "./weeek-client.mjs";

const ALLOWED_SOURCES = new Set(["main", "login", "eureka"]);
const SOURCE_TITLES = {
  main: "enterFBS — заявка с лендинга",
  login: "enterFBS — запрос доступа",
  eureka: "eurekaECOM — заявка с лендинга",
};
const UPSTREAM_DEFAULT = "https://fbs.revelio.tech/api/fbs-leads";

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(body));
}

function corsPreflight(res) {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end();
}

function normalizePhone(raw) {
  const phone = String(raw || "").trim();
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "";
  return phone;
}

function leadDescription(payload) {
  const lines = [`Телефон: ${payload.phone}`];
  if (payload.preferred_call_time) {
    lines.push(`Удобное время: ${payload.preferred_call_time}`);
  }
  lines.push(`Источник: ${payload.source}`);
  if (payload.consent) lines.push("Согласие на обработку ПД: да");
  return lines.join("\n");
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function forwardUpstream(payload) {
  const upstream = (process.env.FBS_LEADS_UPSTREAM_URL || UPSTREAM_DEFAULT).trim();
  const response = await fetch(upstream, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export async function handleFbsLeads(req, res, url) {
  if (url.pathname !== "/api/fbs-leads") return false;

  if (req.method === "OPTIONS") {
    corsPreflight(res);
    return true;
  }

  if (req.method !== "POST") {
    json(res, 405, { success: false, error: "Method not allowed" });
    return true;
  }

  const body = await readJsonBody(req);
  if (!body) {
    json(res, 400, { success: false, error: "invalid JSON" });
    return true;
  }

  const source = String(body.source || "").trim();
  if (!ALLOWED_SOURCES.has(source)) {
    json(res, 400, { success: false, error: "Некорректный источник заявки" });
    return true;
  }

  const phone = normalizePhone(body.phone);
  if (!phone) {
    json(res, 400, { success: false, error: "Укажите корректный номер телефона" });
    return true;
  }

  const consent = Boolean(body.consent);
  if (source !== "login" && !consent) {
    json(res, 400, { success: false, error: "Нужно согласие на обработку персональных данных" });
    return true;
  }

  const payload = {
    phone,
    consent,
    source,
    preferred_call_time: String(body.preferred_call_time || "").trim(),
  };

  try {
    if (weeekConfig().configured) {
      await createWeeekLeadTask({
        title: SOURCE_TITLES[source] || SOURCE_TITLES.main,
        description: leadDescription(payload),
      });
      json(res, 200, { success: true });
      return true;
    }

    const upstream = await forwardUpstream(payload);
    if (!upstream.ok || upstream.data.success !== true) {
      json(res, upstream.status >= 400 ? upstream.status : 502, {
        success: false,
        error: upstream.data.error || "Не удалось отправить заявку",
      });
      return true;
    }

    json(res, 200, { success: true });
  } catch (error) {
    const message = error && error.message ? error.message : "Не удалось отправить заявку";
    json(res, 502, { success: false, error: message });
  }

  return true;
}
