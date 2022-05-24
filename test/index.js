const { expect } = require("chai");
const { ethers } = require("hardhat");

require("@nomiclabs/hardhat-waffle");

describe("NFTTicket", async function () {
  let market;
  let nft;
  let sellerAddress;
  beforeEach(async function () {
    const Market = await ethers.getContractFactory("TicketMarket");
    market = await Market.deploy();
    await market.deployed();

    const NFT = await ethers.getContractFactory("NFTTicket");
    nft = await NFT.deploy(market.address);
    await nft.deployed();

    [sellerAddress] = await ethers.getSigners();
  });

  it("It should correctly create an NFT", async function () {
    const createTokenEvent = await nft
      .connect(sellerAddress)
      .createToken("url/1.json", 10);
    let tokenId = await createTokenEvent.wait();
    tokenId.events.forEach((element) => {
      if (element.event == "NFTTicketCreated") {
        tokenId = element.args.tokenId.toNumber();
      }
    });
    const tokenUri = await nft.uri(tokenId);
    console.log("Token ID = ", tokenId);
    console.log("Token URL = ", tokenUri);
    expect(tokenUri).to.equal("url/1.json");
  });

  it("It should correctly mint extra quantity of a token", async function () {
    const createTokenEvent = await nft
      .connect(sellerAddress)
      .createToken("url/1.json", 5);
    let tokenId = await createTokenEvent.wait();
    tokenId.events.forEach((element) => {
      if (element.event == "NFTTicketCreated") {
        tokenId = element.args.tokenId.toNumber();
      }
    });
    let tknQty = await nft.balanceOf(sellerAddress.address, tokenId);
    console.log("Token ID = ", tokenId);
    console.log("Initial Tokens Qty = ", tknQty.toNumber());
    await nft.connect(sellerAddress).addTokens(tokenId, 10);
    tknQty = await nft.balanceOf(sellerAddress.address, tokenId);
    console.log("New Tokens Qty = ", tknQty.toNumber());
    expect(tknQty).to.equal(15);
  });
});

describe("General test of all functions", function () {
  it("It should create events, tickets, and execute ticket sales", async function () {
    const Market = await ethers.getContractFactory("TicketMarket");
    const market = await Market.deploy();
    await market.deployed();
    const marketAddress = market.address;

    const NFT = await ethers.getContractFactory("NFTTicket");
    const nft = await NFT.deploy(marketAddress);
    await nft.deployed();
    const nftContract = nft.address;

    //A way to get test addresses. The first address is the deployment address so we ignore it with a "_"
    const [_, buyerAddress, buyerAddress2, sellerAddress, sellerAddress2] =
      await ethers.getSigners();

    //this method allows us to deal with whole units instead of wei. In here its not 100 ether, its 100 matic (1MATIC = 1.3GBP).
    const ticketPrice = ethers.utils.parseUnits("100", "ether");
    const maxPrice = ethers.utils.parseUnits("150", "ether");
    const resalePrice = ethers.utils.parseUnits("150", "ether");
    //your_string

    /*
    string name,
    string description,
    string imageUri,
    string location,
    uint64 eventStartDate
    */

    const createEventEvent = await market
      .connect(sellerAddress)
      .createEvent(
        "url/event/1.json",
        Math.floor(new Date("2023-05-18, 23:59:59").getTime() / 1000)
      );
    let eventId = await createEventEvent.wait();
    console.log("EVENT 1", eventId.events[0].args);
    eventId = eventId.events[0].args.eventId.toNumber();
    //await market.connect(sellerAddress).setEventUri(eventId, "url/event/1.json");

    let getEvent = await market.connect(buyerAddress).getEvent(1);
    getEvent = {
      eventId: getEvent.eventId.toString(),
      uri: getEvent.uri,
      startDate: new Date(
        getEvent.startDate.toNumber() * 1000
      ).toLocaleDateString(),
      owner: getEvent.owner,
    };

    console.log("Get event: ", getEvent);

    const createEventEvent2 = await market
      .connect(sellerAddress2)
      .createEvent(
        "url/event/2.json",
        Math.floor(new Date("2022-12-23").getTime() / 1000)
      );
    let eventId2 = await createEventEvent2.wait();
    console.log("EVENT 2", eventId2.events[0].args);
    eventId2 = eventId2.events[0].args.eventId.toNumber();
    //await market.connect(sellerAddress2).setEventUri(eventId2, "url/event/2.json");

    const createTokenEvent = await nft
      .connect(sellerAddress)
      .createToken("url/1.json", 10);
    let tokenId = await createTokenEvent.wait();
    tokenId.events.forEach((element) => {
      if (element.event == "NFTTicketCreated") {
        tokenId = element.args.tokenId.toNumber();
      }
    });
    console.log("Token ID = ", tokenId);
    const nftURI = await nft.uri(tokenId);
    console.log("URI For Token ID 1 =", nftURI);

    await market
      .connect(sellerAddress)
      .createMarketTicket(
        eventId,
        tokenId,
        nftContract,
        4,
        10,
        ticketPrice,
        10,
        maxPrice
      );

    await market
      .connect(buyerAddress)
      .buyTicket(nftContract, tokenId, 2, { value: ticketPrice.mul(2) });

    const myNfts = await nft.balanceOf(buyerAddress.address, tokenId);
    console.log("Intial Buyer's NFTs = ", myNfts.toString());

    let allEvents = await market.getAllEvents();
    allEvents = await Promise.all(
      allEvents.map(async (i) => {
        let _event = {
          eventId: i.eventId.toString(),
          uri: i.uri,
          startDate: new Date(
            i.startDate.toNumber() * 1000
          ).toLocaleDateString(),
          ticketTotal: i.ticketTotal.toNumber(),
          ticketsSold: i.ticketsSold.toNumber(),
          owner: i.owner,
        };
        return _event;
      })
    );
    console.log("All Events: ", allEvents);

    let myEvents = await market.connect(sellerAddress).getMyEvents();
    myEvents = await Promise.all(
      myEvents.map(async (i) => {
        let _event = {
          eventId: i.eventId.toString(),
          uri: i.uri,
          startDate: new Date(
            i.startDate.toNumber() * 1000
          ).toLocaleDateString(),
          ticketTotal: i.ticketTotal.toNumber(),
          ticketsSold: i.ticketsSold.toNumber(),
          owner: i.owner,
        };
        return _event;
      })
    );
    console.log("My Events: ", myEvents);

    let myTickets = await market
      .connect(buyerAddress)
      .getMyTickets(nftContract);

    /**    uint256 tokenId;
    uint eventId;
    address payable seller;
    address payable owner;
    uint256 price;
    uint256 purchaseLimit;
    uint256 totalSupply;
    bool sold; */
    myTickets = await Promise.all(
      myTickets.map(async (i) => {
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let maxResalePrice = ethers.utils.formatUnits(
          i.maxResalePrice.toString(),
          "ether"
        );
        let qty = await nft.balanceOf(
          buyerAddress.address,
          i.tokenId.toNumber()
        );
        let _ticket = {
          tokenId: i.tokenId.toString(),
          eventId: i.eventId.toString(),
          price: `${price} MATIC`,
          quantity: qty.toNumber(),
          purchaseLimit: i.purchaseLimit.toString(),
          totalSupply: i.totalSupply.toString(),
          royaltyFee: `${i.royaltyFee.toString()}%`,
          maxResalePrice: `${maxResalePrice} MATIC`,
        };
        return _ticket;
      })
    );
    console.log("My tickets: ", myTickets);

    await nft.connect(sellerAddress).addTokens(tokenId, 7);
    const extraNfts = await nft.balanceOf(sellerAddress.address, tokenId);
    console.log("Added NFTs count = ", extraNfts.toString());
    await market
      .connect(sellerAddress)
      .addMoreTicketsToMarket(nftContract, tokenId, 7);

    let myEvents2 = await market.connect(sellerAddress).getMyEvents();
    myEvents2 = await Promise.all(
      myEvents2.map(async (i) => {
        let _event = {
          eventId: i.eventId.toString(),
          uri: i.uri,
          startDate: new Date(
            i.startDate.toNumber() * 1000
          ).toLocaleDateString(),
          ticketTotal: i.ticketTotal.toNumber(),
          ticketsSold: i.ticketsSold.toNumber(),
          owner: i.owner,
        };
        return _event;
      })
    );
    console.log("My Events after adding tickets: ", myEvents2);

    let myTickets2 = await market
      .connect(buyerAddress)
      .getMyTickets(nftContract);

    /**    uint256 tokenId;
    uint eventId;
    address payable seller;
    address payable owner;
    uint256 price;
    uint256 purchaseLimit;
    uint256 totalSupply;
    bool sold; */
    myTickets2 = await Promise.all(
      myTickets2.map(async (i) => {
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let maxResalePrice = ethers.utils.formatUnits(
          i.maxResalePrice.toString(),
          "ether"
        );
        let qty = await nft.balanceOf(
          buyerAddress.address,
          i.tokenId.toNumber()
        );
        let _ticket = {
          tokenId: i.tokenId.toString(),
          eventId: i.eventId.toString(),
          price: `${price} MATIC`,
          quantity: qty.toNumber(),
          purchaseLimit: i.purchaseLimit.toString(),
          totalSupply: i.totalSupply.toString(),
          royaltyFee: `${i.royaltyFee.toString()}%`,
          maxResalePrice: `${maxResalePrice} MATIC`,
        };
        return _ticket;
      })
    );
    console.log("My tickets after adding extra: ", myTickets2);

    //EXPLANATION - https://ethereum.stackexchange.com/questions/117944/why-do-i-keep-receiving-this-error-revert-erc721-transfer-caller-is-not-owner
    //You need to give the market approval again for some reason before being able to resale ticket

    await nft.connect(buyerAddress).giveResaleApproval(1);
    const listForResealEvent = await market
      .connect(buyerAddress)
      .listOnResale(nftContract, 1, resalePrice);
    let resaleId = await listForResealEvent.wait();
    resaleId.events.forEach((element) => {
      if (element.event == "ResaleTicketCreated") {
        resaleId = element.args.resaleId.toNumber();
      }
    });
    console.log("resaleId = ", resaleId);

    await nft.connect(buyerAddress).giveResaleApproval(1);
    const listForResealEvent2 = await market
      .connect(buyerAddress)
      .listOnResale(nftContract, 1, resalePrice);
    let resaleId2 = await listForResealEvent2.wait();
    resaleId2.events.forEach((element) => {
      if (element.event == "ResaleTicketCreated") {
        resaleId2 = element.args.resaleId.toNumber();
      }
    });
    console.log("resaleId = ", resaleId2);

    let myResaleListings = await market
      .connect(buyerAddress)
      .getMyResaleListings();
    myResaleListings = await Promise.all(
      myResaleListings.map(async (i) => {
        let price = ethers.utils.formatUnits(i.resalePrice.toString(), "ether");
        let _ticket = {
          resaleId: i.resaleId.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          price: `${price} MATIC`,
          sold: i.sold,
        };
        return _ticket;
      })
    );
    console.log("My Resale Listings: ", myResaleListings);

    let resaleTickets = await market.getResaleTickets(1);

    // struct ResaleTicket {
    //   uint256 resaleId;
    //   uint256 tokenId;
    //   address payable seller;
    //   uint256 resalePrice;
    // }
    resaleTickets = await Promise.all(
      resaleTickets.map(async (i) => {
        let price = ethers.utils.formatUnits(i.resalePrice.toString(), "ether");
        let _ticket = {
          resaleId: i.resaleId.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          price: `${price} MATIC`,
          sold: i.sold,
        };
        return _ticket;
      })
    );
    console.log("Resale tickets: ", resaleTickets);

    await market
      .connect(buyerAddress2)
      .buyResaleTicket(nftContract, resaleId, { value: resalePrice });

    resaleTickets = await market.getResaleTickets(1);
    resaleTickets = await Promise.all(
      resaleTickets.map(async (i) => {
        let price = ethers.utils.formatUnits(i.resalePrice.toString(), "ether");
        let _ticket = {
          resaleId: i.resaleId.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          resalePrice: `${price} MATIC`,
          sold: i.sold,
        };
        return _ticket;
      })
    );
    console.log("Resale tickets after purchase: ", resaleTickets);

    const newResalePrice = ethers.utils.parseUnits("125", "ether");
    await nft.connect(buyerAddress2).giveResaleApproval(1);
    const listForResellEvent3 = await market
      .connect(buyerAddress2)
      .listOnResale(nftContract, 1, newResalePrice);
    const bal = await nft.balanceOf(buyerAddress.address, 1);
    console.log("HIS BAL IS", bal);
    let resaleId3 = await listForResellEvent3.wait();
    resaleId3.events.forEach((element) => {
      if (element.event == "ResaleTicketCreated") {
        resaleId3 = element.args.resaleId.toNumber();
      }
    });
    console.log("resaleId3 = ", resaleId3);

    resaleTickets = await market.getResaleTickets(1);
    resaleTickets = await Promise.all(
      resaleTickets.map(async (i) => {
        let price = ethers.utils.formatUnits(i.resalePrice.toString(), "ether");
        let _ticket = {
          resaleId: i.resaleId.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          resalePrice: `${price} MATIC`,
          sold: i.sold,
        };
        return _ticket;
      })
    );

    console.log(
      "Resale tickeets for ticket 1 after listing, buying and re-listing:",
      resaleTickets
    );

    //Running this will throw expected error as address has already listed all its tokens
    // await market
    //   .connect(sellerAddress)
    //   .validateTicket(nftContract, buyerAddress.address, 1);

    console.log(new Date(1649422882 * 1000).toLocaleString());
    const myDate = new Date("04/08/22, 23:59:59").toLocaleString();
    console.log(myDate.toLocaleString());
  });
});

describe("Ticket validation", function () {
  it("It should correctly validate ticket", async function () {
    const Market = await ethers.getContractFactory("TicketMarket");
    const market = await Market.deploy();
    await market.deployed();
    const marketAddress = market.address;

    const NFT = await ethers.getContractFactory("NFTTicket");
    const nft = await NFT.deploy(marketAddress);
    await nft.deployed();
    const nftContract = nft.address;

    //A way to get test addresses. The first address is the deployment address so we ignore it with a "_"
    const [_, buyerAddress, sellerAddress] = await ethers.getSigners();

    //this method allows us to deal with whole units instead of wei. In here its not 100 ether, its 100 matic (1MATIC = 1.3GBP).
    const ticketPrice = ethers.utils.parseUnits("100", "ether");
    const maxPrice = ethers.utils.parseUnits("150", "ether");
    const resalePrice = ethers.utils.parseUnits("150", "ether");
    //your_string

    /*
    string name,
    string description,
    string imageUri,
    string location,
    uint64 eventStartDate
    */

    const createEventEvent = await market
      .connect(sellerAddress)
      .createEvent(
        "url/event/1.json",
        Math.floor(new Date("2023-05-18, 23:59:59").getTime() / 1000)
      );
    let eventId = await createEventEvent.wait();
    console.log("EVENT 1", eventId.events[0].args);
    eventId = eventId.events[0].args.eventId.toNumber();
    //await market.connect(sellerAddress).setEventUri(eventId, "url/event/1.json");

    let getEvent = await market.connect(buyerAddress).getEvent(1);
    getEvent = {
      eventId: getEvent.eventId.toString(),
      uri: getEvent.uri,
      startDate: new Date(
        getEvent.startDate.toNumber() * 1000
      ).toLocaleDateString(),
      owner: getEvent.owner,
    };

    console.log("Get event: ", getEvent);

    const createTokenEvent = await nft
      .connect(sellerAddress)
      .createToken("url/1.json", 10);
    let tokenId = await createTokenEvent.wait();
    tokenId.events.forEach((element) => {
      if (element.event == "NFTTicketCreated") {
        tokenId = element.args.tokenId.toNumber();
      }
    });
    console.log("Token ID = ", tokenId);
    const nftURI = await nft.uri(tokenId);
    console.log("URI For Token ID 1 =", nftURI);

    await market
      .connect(sellerAddress)
      .createMarketTicket(
        eventId,
        tokenId,
        nftContract,
        4,
        10,
        ticketPrice,
        10,
        maxPrice
      );

    await market
      .connect(buyerAddress)
      .buyTicket(nftContract, tokenId, 2, { value: ticketPrice.mul(2) });

    const myNfts = await nft.balanceOf(buyerAddress.address, tokenId);
    console.log("Intial Buyer's NFTs = ", myNfts.toString());

    let myTickets = await market
      .connect(buyerAddress)
      .getMyTickets(nftContract);

    /**    uint256 tokenId;
    uint eventId;
    address payable seller;
    address payable owner;
    uint256 price;
    uint256 purchaseLimit;
    uint256 totalSupply;
    bool sold; */
    myTickets = await Promise.all(
      myTickets.map(async (i) => {
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let maxResalePrice = ethers.utils.formatUnits(
          i.maxResalePrice.toString(),
          "ether"
        );
        let qty = await nft.balanceOf(
          buyerAddress.address,
          i.tokenId.toNumber()
        );
        let _ticket = {
          tokenId: i.tokenId.toString(),
          eventId: i.eventId.toString(),
          price: `${price} MATIC`,
          quantity: qty.toNumber(),
          purchaseLimit: i.purchaseLimit.toString(),
          totalSupply: i.totalSupply.toString(),
          royaltyFee: `${i.royaltyFee.toString()}%`,
          maxResalePrice: `${maxResalePrice} MATIC`,
        };
        return _ticket;
      })
    );
    console.log("My tickets: ", myTickets);

    console.log("VALIDATE:");
    console.log("Buyer addresss = ", buyerAddress.address);
    // The hash we wish to sign and verify
    let messageHash = ethers.utils.id(tokenId);
    // Note: messageHash is a string, that is 66-bytes long, to sign the
    //       binary value, we must convert it to the 32 byte Array that
    //       the string represents
    //
    // i.e.
    //   // 66-byte string
    //   "0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba"
    //
    //   ... vs ...
    //
    //  // 32 entry Uint8Array
    //  [ 89, 47, 167, 67, 136, 159, 199, 249, 42, 194, 163,
    //    123, 177, 245, 186, 29, 175, 42, 92, 132, 116, 28,
    //    160, 224, 6, 29, 36, 58, 46, 103, 7, 186]

    let messageHashBytes = ethers.utils.arrayify(messageHash);

    // Sign the binary data
    let flatSig = await buyerAddress.signMessage(messageHashBytes);

    // For Solidity, we need the expanded-format of a signature
    let sig = ethers.utils.splitSignature(flatSig);
    console.log("Sig = ", flatSig);

    const validateTicketEvent = await market
      .connect(sellerAddress)
      .validateTicket(nftContract, tokenId, messageHash, sig.v, sig.r, sig.s);
    let signatureAddress = await validateTicketEvent.wait();
    signatureAddress.events.forEach((element) => {
      if (element.event == "TicketValidated") {
        signatureAddress = element.args.ownerAddress;
      }
    });
    console.log(signatureAddress);
  });
});
