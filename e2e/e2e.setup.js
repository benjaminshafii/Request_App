const util = require('util');
const checkPortStatus = util.promisify(require('portscanner').checkPortStatus);
const IPFSFactory = require('ipfsd-ctl');

const IPFS_PORT = 5001;
const GANACHE_PORT = 8545;

module.exports = class E2eSetup {
  async startup() {
    // Check if ganache is running
    const ganachePortStatus = await checkPortStatus(GANACHE_PORT, '127.0.0.1');
    if (ganachePortStatus === 'closed') {
      throw new Error(
        `E2E tests need ganache running on port ${GANACHE_PORT}.`
      );
    }

    // Check if ipfs is already running
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
                'Access-Control-Allow-Origin': ['*']
              }
            },
            Addresses: {
              API: '/ip4/127.0.0.1/tcp/5001'
            }
          }
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

  async stop() {
    // Stop ipfs
    if (this.ipfs) {
      this.ipfs.stop();
    }
  }
};
