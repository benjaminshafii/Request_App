const puppeteer = require('puppeteer');
const dappeteer = require('dappeteer');
const expect = require('chai').expect;
const Web3 = require('web3');
const RequestNetwork = require('@requestnetwork/request-network.js');

module.exports = async function main() {
  const browser = await dappeteer.launch(puppeteer);
  const metamask = await dappeteer.getMetamask(browser);
  const web3 = new Web3(
    new Web3.providers.HttpProvider('http://localhost:8545')
  );

  const accPayee = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
  const accPayer = '0xB514C66223c7F3AE419f61cc74cF3c1DFC3510F2';
  const expectedAmount = '1.53421693';

  // Import an account
  await metamask.importAccount(
    'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'
  );

  // Set the localhost network on metamask
  await metamask.switchNetwork('localhost');

  // go to the dapp and wait for it to be ready
  const page = await browser.newPage();
  await page.goto('http://localhost:4200/');
  await page.waitForSelector('#wallet-type');

  // Fill the request fields and submit
  await page.type('input[name=expectedAmount]', expectedAmount);
  await page.type('input[name=payerETHAddress]', accPayer);
  const payButton = await page.$('#create-request-button');
  await payButton.click();

  // Wait one second and confirm the transaction
  await new Promise(resolve => setTimeout(() => resolve(), 1000));
  await metamask.confirmTransaction({
    gasLimit: 300000,
    gasPrice: 10
  });

  // Returns to the dapp and verify if the amount matches
  page.bringToFront();
  await page.waitForSelector('#request-expected-amount');
  const requestAmount = (await page.$eval(
    '#request-expected-amount',
    el => el.textContent
  )).match('[0-9.,]+')[0];

  expect(requestAmount).to.equal(expectedAmount);

  // Find the request object from the blockchain
  const requestUrl = await page.$eval('.url-box', el => el.value);
  const requestId = RegExp('/requestId/([^?]*)').exec(requestUrl)[1];

  const networkId = await web3.eth.net.getId();
  const requestNetwork = new RequestNetwork.default(
    web3.currentProvider,
    networkId,
    false
  );
  const request = await requestNetwork.fromRequestId(requestId);
  request.requestData = await request.getData();

  // Verify that the request amount is the same as the expected amount
  expect(web3.utils.fromWei(request.requestData.payee.expectedAmount)).to.equal(
    expectedAmount
  );
  expect(request.requestData.payer).to.equal(accPayer);
  expect(request.requestData.payee.address).to.equal(accPayee);
  expect(request.requestData.payee.balance.toString()).to.equal('0');

  // Search for all the payee's requests
  await page.evaluate(function() {
    document.querySelector('input[name=searchValueFormControl]').value = '';
  });

  await page.type('input[name=searchValueFormControl]', accPayee);
  await page.keyboard.sendCharacter(String.fromCharCode(13));
  await page.waitForSelector('app-search a');

  // Select the latest request from payee address
  const requestLink = await page.$('app-search a');
  requestLink.click();

  // Check that the url matches the one from the request just created
  await page.waitForSelector('.url-box');
  const searchRequestUrl = await page.$eval('.url-box', el => el.value);
  expect(searchRequestUrl).to.equal(requestUrl);

  // Check again that the amount matches
  const searchRequestAmount = (await page.$eval(
    '#request-expected-amount',
    el => el.textContent
  )).match('[0-9.,]+')[0];
  expect(searchRequestAmount).to.equal(expectedAmount);

  await browser.close();
};
