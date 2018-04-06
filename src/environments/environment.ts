// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  // a mapping to erc20 address
  currencyToContract: {
    REQ: '0x345cA3e014Aaf5dcA488057592ee47305D9B3e10',
  },
};
