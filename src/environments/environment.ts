import 'zone.js/dist/zone-error';

export const environment = {
  production: false,
  usePublicIpfs: undefined,
  ipfsCustomNode: {
    host: 'ipfs.infura.io',
    port: 443,
    protocol: 'https',
  },
};
