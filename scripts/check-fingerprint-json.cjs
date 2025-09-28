require('ts-node').register({ transpileOnly: true });
const assert = require('node:assert/strict');
const { fingerprintJson } = require('../lib/utils/json');

const fixtures = [
  {
    name: 'object key order',
    left: { b: 2, a: 1, c: { z: 9, y: 8 } },
    right: { a: 1, b: 2, c: { y: 8, z: 9 } },
    expectEqual: true,
  },
  {
    name: 'array order significance',
    left: { list: [1, 2, 3] },
    right: { list: [3, 2, 1] },
    expectEqual: false,
  },
  {
    name: 'null vs undefined pruning',
    left: { value: null },
    right: { value: undefined },
    expectEqual: false,
  },
  {
    name: 'deeply nested text nodes',
    left: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'world' }] },
      ],
    },
    right: {
      content: [
        { content: [{ text: 'hello', type: 'text' }], type: 'paragraph' },
        { content: [{ text: 'world', type: 'text' }], type: 'paragraph' },
      ],
      type: 'doc',
    },
    expectEqual: true,
  },
];

let failures = 0;

for (const { name, left, right, expectEqual } of fixtures) {
  const leftHash = fingerprintJson(left);
  const rightHash = fingerprintJson(right);
  const equal = leftHash === rightHash;
  try {
    assert.equal(equal, expectEqual, `${name} expected equality=${expectEqual} but got hashes ${leftHash} / ${rightHash}`);
    console.info(`[fingerprint-json] PASS ${name}: ${leftHash}`);
  } catch (error) {
    failures += 1;
    console.error(`[fingerprint-json] FAIL ${name}:`, error instanceof Error ? error.message : error);
  }
}

if (failures > 0) {
  console.error(`[fingerprint-json] completed with ${failures} failure(s)`);
  process.exit(1);
}

console.info('[fingerprint-json] all checks passed');
