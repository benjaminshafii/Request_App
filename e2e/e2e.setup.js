const util = require('util');
const puppeteer = require('puppeteer');
const checkPortStatus = util.promisify(require('portscanner').checkPortStatus);
const IPFSFactory = require('ipfsd-ctl');
const { IPFS_PORT, GANACHE_PORT, debug } = require('./config.json');

module.exports = class E2eSetup {
  constructor(appUrl) {
    this.appUrl = appUrl;
  }
  async startup() {
    await this.checkGanacheIsRunning();
    await this.setupIpfs();
    await this.setupPuppeter();
  }

  async navigate() {
    await this.page.goto(this.appUrl);
  }

  async stop() {
    // Stop ipfs
    if (this.ipfs) {
      this.ipfs.stop();
    }
    if (this.browser) {
      this.browser.close();
    }
  }

  async setupPuppeter() {
    this.browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-web-security'],
      headless: !debug,
      devtools: debug,
    });

    this.page = await this.browser.newPage();
  }

  async setupIpfs() {
    const ipfsPortStatus = await checkPortStatus(IPFS_PORT, '127.0.0.1');
    // If ipfs is not running, launch a daemon for the test
    if (ipfsPortStatus === 'closed') {
      IPFSFactory.create({ type: 'go', port: IPFS_PORT }).spawn(
        {
          args: ['--offline'],
          config: {
            API: {
              HTTPHeaders: {
                'Access-Control-Allow-Credentials': ['true'],
                'Access-Control-Allow-Methods': ['PUT', 'GET', 'POST'],
                'Access-Control-Allow-Origin': ['*'],
              },
            },
            Addresses: {
              API: '/ip4/127.0.0.1/tcp/5001',
            },
          },
        },
        (error, ipfsd) => {
          if (error) {
            console.log('IPFS daemon already running.');
          } else {
            this.ipfs = ipfsd;
          }
        }
      );
    }
  }

  async checkGanacheIsRunning() {
    const ganachePortStatus = await checkPortStatus(GANACHE_PORT, '127.0.0.1');
    if (ganachePortStatus === 'closed') {
      throw new Error(
        `E2E tests need ganache running on port ${GANACHE_PORT}.`
      );
    }
  }
};
