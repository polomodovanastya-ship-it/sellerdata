const { test } = require('node:test');
const assert = require('node:assert/strict');

const { submitLead, validPhone } = require('../js/lead-form.js');

test('submitLead posts the backend request contract and omits the slot placeholder', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({ success: true }),
    };
  };

  await submitLead(fetchImpl, {
    phone: '  +7 900 000-00-00  ',
    preferredCallTime: 'Выбрать дату и время',
    consent: true,
  });

  assert.equal(request.url, '/api/eurekaecom-leads');
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(request.options.headers, { 'Content-Type': 'application/json' });
  assert.deepEqual(JSON.parse(request.options.body), {
    phone: '+7 900 000-00-00',
    preferred_call_time: '',
    consent: true,
  });
});

test('submitLead preserves a selected preferred call time', async () => {
  let body;
  const fetchImpl = async (_url, options) => {
    body = JSON.parse(options.body);
    return { ok: true, json: async () => ({ success: true }) };
  };

  await submitLead(fetchImpl, {
    phone: '+7 (900) 000-00-00',
    preferredCallTime: '30 авг, 15:00',
    consent: true,
  });

  assert.equal(body.preferred_call_time, '30 авг, 15:00');
});

test('submitLead rejects an HTTP error response', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 502,
    json: async () => ({ error: 'Не удалось отправить заявку' }),
  });

  await assert.rejects(
    submitLead(fetchImpl, { phone: '+79000000000', preferredCallTime: '', consent: true }),
    /Не удалось отправить заявку/
  );
});

test('submitLead rejects an HTTP success with success=false', async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ success: false }),
  });

  await assert.rejects(
    submitLead(fetchImpl, { phone: '+79000000000', preferredCallTime: '', consent: true }),
    /Не удалось отправить заявку/
  );
});

test('validPhone follows backend phone character and digit limits', () => {
  for (const phone of ['+7 900 000-00-00', '+7 (900) 000-00-00', '1234567']) {
    assert.equal(validPhone(phone), true, phone);
  }
  for (const phone of ['', '123 456', '1234567890123456', '+7.900.000.00.00', '+7\t9000000000']) {
    assert.equal(validPhone(phone), false, phone);
  }
});
