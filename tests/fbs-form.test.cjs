const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { submitLead, LEAD_GOAL, METRIKA_ID } = require(path.join(__dirname, "..", "js", "fbs-form.js"));

test("submitLead sends eureka payload to /api/fbs-leads", async () => {
  let request;
  const fetchStub = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({ success: true }),
    };
  };

  await submitLead(
    {
      phone: "+7 900 000-00-00",
      preferred_call_time: "Прямо сейчас",
      consent: true,
      source: "eureka",
    },
    fetchStub,
  );

  assert.equal(request.url, "/api/fbs-leads");
  assert.equal(request.options.method, "POST");
  assert.deepEqual(JSON.parse(request.options.body), {
    phone: "+7 900 000-00-00",
    preferred_call_time: "Прямо сейчас",
    consent: true,
    source: "eureka",
  });
});

test("submitLead surfaces the server error", async () => {
  const fetchStub = async () => ({
    ok: false,
    json: async () => ({ success: false, error: "CRM недоступна" }),
  });

  await assert.rejects(
    submitLead({ phone: "+7", consent: true, source: "eureka" }, fetchStub),
    /CRM недоступна/,
  );
});

test("submitLead fires Metrika only after CRM success", async () => {
  const calls = [];
  const prevYm = globalThis.ym;
  globalThis.ym = function () {
    calls.push(Array.from(arguments));
  };

  try {
    await submitLead(
      { phone: "+7 900 000-00-00", consent: true, source: "eureka" },
      async () => ({ ok: true, json: async () => ({ success: true }) }),
    );

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], [METRIKA_ID, "reachGoal", LEAD_GOAL, { source: "eureka" }]);
  } finally {
    if (prevYm === undefined) delete globalThis.ym;
    else globalThis.ym = prevYm;
  }
});
