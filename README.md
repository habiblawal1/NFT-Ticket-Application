# NFTickets Event Ticketing Application - Computer Science Final Year Project

## Instructions to run an application on browser

1. On Google chrome, install the Metamask chrome extension
2. Follow the instructions to create or login to a wallet
3. Go to the chrome extension, click the existing networks, then select add new network
4. Enter the following details to add the Mumbai Test Network

- Network Name = Mumbai Testnet
- New RPC URL = https://matic-mumbai.chainstacklabs.com
- Chain ID = 80001
- Currency Symbol = MATIC

5. If you want to add fake MATIC tokens to purchase tokens, follow these instructions:

- Go to the Metamask extension and copy your wallet's public address
- Naviate to https://faucet.polygon.technology
- Chose network to be Mumbai and tokken to be MATIC
- Paste your address into the wallet address field and then press submit
- 0.1 MATIC should arrive in your account within a couple of minutes

6. Go to the website at https://nfticketing.vercel.app/

## Instructions to run an application on mobile phone

1. Download the Metamask App
2. Follow the instructions to create or login to a wallet
3. Follow the instructions from step 4 above to add the Mumbai Test Network
4. Go to menu->browser
5. In the Metamask go the website at https://nfticketing.vercel.app/

## Local compilation of code

1. Run the command "npx hardhat node" and do not kill terminal while running the app as is it locally runs the blockchain
2. On a second terminal run the command "npx hardhat run scripts/deploy.js --network localhost" to run intial startup scripts
3. Run "npm run dev" to startup web application
4. Switch the network on Metamask to Localhost 8545
