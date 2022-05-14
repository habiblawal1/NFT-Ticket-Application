require("@nomiclabs/hardhat-waffle");

// const dotenv = require("dotenv");
// dotenv.config({ path: __dirname + "/.env.local" });
// const fs = require("fs");

// const privateKey = fs.readFileSync("./.secret").toString().trim();

const secret = require("./secret.json");

//The project Id given to us by infura so we can connect to the mumbai test  network
// const projectID = process.env.PROJECT_ID;

// console.log("Project ID = ", secret.projectID);
// console.log("Private Key = ", secret.privateKey);

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

//hard hat is our local network
//mumbai is our test network. Chain ID is something used with the hardhat documentation so just it need it there for it to work

const infuraUrl = `https://polygon-mumbai.infura.io/v3/${secret.projectID}`;
const alchemyUrl = `https://polygon-mumbai.g.alchemy.com/v2/${secret.alchemyKey}`;
// console.log(alchemyUrl);
// console.log(
//   alchemyUrl ==
//     "https://polygon-mumbai.g.alchemy.com/v2/7eczfb50mi2yH4-K-5W9r8SqTxquffzZ"
// );
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      url: secret.infuraURL,
      accounts: [secret.privateKey],
    },
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
