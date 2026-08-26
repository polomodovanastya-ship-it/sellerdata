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
