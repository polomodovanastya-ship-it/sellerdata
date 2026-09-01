const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('index references only existing local assets', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  const localRefs = refs.filter((ref) => !/^(?:https?:|#|mailto:|tel:)/.test(ref));

  assert.ok(localRefs.length > 0);
  assert.match(html, /href="\/favicon\.ico"/);
  assert.match(html, /href="\/site\.webmanifest"/);
  for (const ref of localRefs) {
    const filePath = ref.startsWith("/") ? ref.slice(1) : ref;
    assert.ok(fs.existsSync(path.resolve(filePath)), `Missing local asset: ${ref}`);
  }
  assert.match(html, /fbs-form\.js/);
  assert.match(html, /id="submit-error"/);
});
