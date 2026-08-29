(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SellerdataLead = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SLOT_PLACEHOLDER = "Выбрать дату и время";
  const PHONE_PATTERN = /^\+?[0-9() -]{6,29}$/;
  const SUBMIT_ERROR = "Не удалось отправить заявку. Попробуйте ещё раз.";

  function validPhone(value) {
    const phone = String(value || "").trim();
    if (!PHONE_PATTERN.test(phone)) return false;
    const digits = (phone.match(/[0-9]/g) || []).length;
    return digits >= 7 && digits <= 15;
  }

  function requestPayload(input) {
    const preferredCallTime = String(input.preferredCallTime || "").trim();
    return {
      phone: String(input.phone || "").trim(),
      preferred_call_time: preferredCallTime === SLOT_PLACEHOLDER ? "" : preferredCallTime,
      consent: input.consent === true,
    };
  }

  async function submitLead(fetchImpl, input) {
    const response = await fetchImpl("/api/eurekaecom-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload(input)),
    });

    let data;
    try {
      data = await response.json();
    } catch (_error) {
      data = null;
    }
    if (!response.ok || !data || data.success !== true) {
      const message = data && typeof data.error === "string" ? data.error : SUBMIT_ERROR;
      throw new Error(message);
    }
    return data;
  }

  return { submitLead, validPhone };
});
