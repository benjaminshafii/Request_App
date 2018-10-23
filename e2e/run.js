const E2eSetup = require('./e2e.setup');
const createAndSearch = require('./createAndSearch');
const initWeb3Page = require('./web3.setup');
const { GANACHE_PORT, mnemonic } = require('./config.json');

async function runTests() {
  const providerUrl = `http://localhost:${GANACHE_PORT}`;
  const appUrl = 'http://localhost:4200';

  // Setup test environment
  const setup = new E2eSetup(appUrl);
  await setup.startup();

  await initWeb3Page(setup.page, providerUrl, mnemonic);
  setup.navigate();

  // Run tests
  await createAndSearch(setup.page, providerUrl);

  // Stop test environment
  await setup.stop();
  // await process.exit(0);
}

runTests();
