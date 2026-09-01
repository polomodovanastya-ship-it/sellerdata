(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FbsForm = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const endpoint = root.FBS_LEADS_ENDPOINT || "/api/fbs-leads";
  const METRIKA_ID = 111608721;
  const LEAD_GOAL = "fbs_lead_crm";

  function trackLeadGoal(payload) {
    if (typeof root.ym !== "function") return;
    try {
      root.ym(METRIKA_ID, "reachGoal", LEAD_GOAL, {
        source: (payload && payload.source) || "main",
      });
    } catch (_) {
      /* Metrika must never block CRM submit UX */
    }
  }

  async function submitLead(payload, fetchImpl) {
    const request = fetchImpl || root.fetch;
    if (typeof request !== "function") throw new Error("Fetch API недоступен");

    const response = await request(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(function () { return {}; });

    if (!response.ok || data.success !== true) {
      throw new Error(data.error || "Не удалось отправить заявку");
    }

    trackLeadGoal(payload);
    return data;
  }

  return {
    submitLead: submitLead,
    LEAD_GOAL: LEAD_GOAL,
    METRIKA_ID: METRIKA_ID,
  };
});
