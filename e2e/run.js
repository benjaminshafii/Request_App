const E2eSetup = require('./e2e.setup.js');
const createAndSearch = require('./createAndSearch.js');

async function runTests() {
  // Setup test environment
  const setup = new E2eSetup();
  await setup.startup();

  // Run tests
  await createAndSearch();

  // Stop test environment
  await setup.stop();
  await process.exit(0);
}

runTests();
