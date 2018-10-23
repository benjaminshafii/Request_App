const readFileSync = require('fs').readFileSync;

async function loadContents(urls) {
  var contents = [];
  for (url of urls) {
    const raw = url.startsWith('http')
      ? await (await fetch(url)).text()
      : readFileSync(url).toString();
    contents.push(raw);
  }
  return contents;
}

async function injectWeb3(scripts, providerUrl, mnemonic) {
  console.log('[E2E] Injecting Web3...');
  for (script of scripts) {
    eval(script);
  }
  lightwallet.keystore.createVault(
    {
      password: 'abcd',
      seedPhrase: mnemonic,
      hdPathString: "m/0'/0'/0'",
    },
    function(err, ks) {
      if (err) {
        console.warn(err);
        return;
      }

      ks.passwordProvider = function(cb) {
        console.log('password!');
        cb(null, 'abcd');
      };

      // var web3Provider = new SignerProvider(providerUrl, {
      //   signTransaction: (rawTx, cb) => cb(null, ks.signTransaction(rawTx)),
      // });
      var web3Provider = new HookedWeb3Provider({
        host: providerUrl,
        transaction_signer: ks,
      });
      var web3 = new Web3(web3Provider);
      window.web3 = web3;
      console.log('[E2E] Web3 injected!');
    }
  );
}

module.exports = async function initWeb3Page(page, providerUrl, mnemonic) {
  const contents = await loadContents([
    //'https://requirejs.org/docs/release/2.3.6/minified/require.js',
    'https://cdn.jsdelivr.net/gh/ethereum/web3.js/dist/web3.min.js',
    'node_modules/eth-lightwallet/dist/lightwallet.min.js',
    //'node_modules/ethjs-provider-signer/dist/ethjs-provider-signer.min.js',
    'node_modules/hooked-web3-provider/build/hooked-web3-provider.min.js',
  ]);
  await page.evaluateOnNewDocument(injectWeb3, contents, providerUrl, mnemonic);
  return page;
};
