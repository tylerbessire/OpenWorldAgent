import assert from 'assert';
import { NPMPackager } from '../core/npm-packager.js';

function testMethodName() {
  const packager = new NPMPackager();
  assert.strictEqual(packager.methodName('simple-name'), 'simple_name');
  assert.strictEqual(packager.methodName('hello world'), 'hello_world');
  assert.strictEqual(packager.methodName('Tool!@Name'), 'Tool_Name');
}

function run() {
  const tests = [{ name: 'methodName sanitizes tool names', fn: testMethodName }];
  let passed = 0;
  for (const t of tests) {
    try {
      t.fn();
      console.log(`✔ ${t.name}`);
      passed++;
    } catch (err) {
      console.error(`✖ ${t.name}`);
      console.error(err);
    }
  }
  console.log(`${passed}/${tests.length} tests passed`);
  if (passed !== tests.length) {
    process.exit(1);
  }
}

run();
