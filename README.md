<img src="https://request.network/assets/img/request-logo.png" width="50px" >

---
# Request_App

A basic angular dapp using web3.js and RequestNetwork.js for interacting with Request Network Smart-Contract.

## Install Dependencies

You need at least node v8.9.0 and npm 5.5.1 to run this project. Run `npm i` to install all the dependencies listed in package.json

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `npm run build:prod` to generate the build repository in /dist.

## Test

#### Prerequisites

To run end-to-end tests, you need the app running (`npm run start`).
You also need a local instance of ganache running on port `8545`, with smart-contracts deployed.

On the `requestNetwork/packages/requestNetwork.js` directory:
- Launch a ganache-cli instance on a terminal:

  `npm run ganache`

- Then in a second terminal, deploy the contracts:

  `npm run testdeploy`

#### End-to-end test

Run `npm run e2e` for end-to-end tests.

