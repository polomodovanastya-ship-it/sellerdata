const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('index references only existing local assets', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  const localRefs = refs.filter((ref) => !/^(?:https?:|#|mailto:|tel:)/.test(ref));

  assert.ok(localRefs.length > 0);
  for (const ref of localRefs) {
    assert.ok(fs.existsSync(path.resolve(ref)), `Missing local asset: ${ref}`);
  }
});

test('lead capture uses semantic accessible form markup', () => {
  const html = fs.readFileSync('index.html', 'utf8');

  assert.match(html, /<form[^>]+id="lead-form"/);
  assert.match(html, /<input[^>]+type="tel"[^>]+id="phone"[^>]+name="phone"[^>]+required/);
  assert.match(html, /<input[^>]+type="checkbox"[^>]+id="consent"[^>]+name="consent"[^>]+required/);
  assert.match(html, /<button[^>]+type="submit"[^>]+id="submit-btn"/);
  assert.match(html, /id="form-error"[^>]+aria-live="polite"/);
  assert.match(html, /id="consent-error"[^>]+aria-live="polite"/);
  assert.match(html, /<script src="js\/lead-form\.js"><\/script>/);
});
