import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

const fs = require("fs");
const privateKey = fs.readFileSync(".secret").toString();
const projectID = "01cc7e5cd63842bea357496477055f04";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

//hard hat is our local network
//mumbai is our test network. Chain ID is something used with the hardhat documentation so just it need it there for it to work
const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    hardat: {
      chainId: 1337,
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${projectID}`,
      accounts: [privateKey],
    },
  },
};

//TODO - Store projectID as an envvar
export default config;
