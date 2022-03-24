import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

const fs = require("fs");
const privateKey = fs.readFileSync(".secret").toString();
const projectID = process.env.PROJECT_ID;

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

//hard hat is our local network
//mumbai is our test network. Chain ID is something used with the hardhat documentation so just it need it there for it to work

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    /*
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${projectID}`
      accounts: [privateKey]
    }
    */
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
//TODO - Store projectID as an envvar
