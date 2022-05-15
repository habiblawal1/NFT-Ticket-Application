require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

const secret = require("./secret.json");

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      url: secret.INFURA_URL,
      accounts: [secret.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: secret.POLYGONSCAN_API_KEY,
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
