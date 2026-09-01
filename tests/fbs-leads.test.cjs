const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const test = require("node:test");

const { handleFbsLeads } = require("../server/fbs-leads.mjs");

function mockReq(method, body) {
  const req = new EventEmitter();
  req.method = method;
  req.headers = {};
  setTimeout(() => {
    req.emit("data", Buffer.from(JSON.stringify(body)));
    req.emit("end");
  }, 0);
  return req;
}

function mockRes() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.headers = {};
  res.writeHead = (status, headers) => {
    res.statusCode = status;
    res.headers = headers;
  };
  res.body = "";
  res.end = (chunk) => {
    res.body += chunk;
    res.emit("finish");
  };
  return res;
}

test("handleFbsLeads rejects unknown source", async () => {
  const req = mockReq("POST", { phone: "+7 900 000-00-00", consent: true, source: "test" });
  const res = mockRes();
  const handled = await handleFbsLeads(req, res, new URL("http://localhost/api/fbs-leads"));
  assert.equal(handled, true);
  assert.equal(res.statusCode, 400);
  assert.match(JSON.parse(res.body).error, /источник/i);
});

test("handleFbsLeads accepts eureka source when WEEEK is configured", async () => {
  const prev = {
    WEEEK_API_TOKEN: process.env.WEEEK_API_TOKEN,
    WEEEK_PROJECT_ID: process.env.WEEEK_PROJECT_ID,
    WEEEK_BOARD_ID: process.env.WEEEK_BOARD_ID,
    WEEEK_BOARD_COLUMN_ID: process.env.WEEEK_BOARD_COLUMN_ID,
  };
  process.env.WEEEK_API_TOKEN = "test-token";
  process.env.WEEEK_PROJECT_ID = "1";
  process.env.WEEEK_BOARD_ID = "2";
  process.env.WEEEK_BOARD_COLUMN_ID = "3";

  const prevFetch = globalThis.fetch;
  let postedBody;
  globalThis.fetch = async (url, options) => {
    postedBody = { url, body: JSON.parse(options.body) };
    return {
      ok: true,
      json: async () => ({ success: true, task: { id: 99 } }),
    };
  };

  try {
    const req = mockReq("POST", {
      phone: "+7 900 000-00-00",
      consent: true,
      source: "eureka",
      preferred_call_time: "Прямо сейчас",
    });
    const res = mockRes();
    await handleFbsLeads(req, res, new URL("http://localhost/api/fbs-leads"));
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), { success: true });
    assert.match(postedBody.url, /\/tm\/tasks$/);
    assert.equal(postedBody.body.title, "eurekaECOM — заявка с лендинга");
    assert.equal(postedBody.body.projectId, 1);
    assert.equal(postedBody.body.boardColumnId, 3);
    assert.match(postedBody.body.description, /\+7 900 000-00-00/);
    assert.match(postedBody.body.description, /Прямо сейчас/);
  } finally {
    globalThis.fetch = prevFetch;
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
