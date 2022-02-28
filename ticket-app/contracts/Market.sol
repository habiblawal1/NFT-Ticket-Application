// SPDX-License-Identifier: MIT
 pragma solidity ^0.8.3;


import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "hardhat/console.sol";

contract NFTMarket is ReentrancyGuard, IERC1155Receiver, ERC165{
  using Counters for Counters.Counter;
  Counters.Counter private _ticketIds;
  Counters.Counter private _eventIds;

  //Used by tutorial as an address to receive listing fees - can't charge people as this is a FYP project unfortunately
  address payable owner;

  struct MarketEvent {
    uint eventId;
    string name;
    string description;
    string imageUri;
    string location;
    uint64 eventStartDate;
    address owner;
    uint[] tickets;
  }

  struct MarketTicket {
    uint ticketId;
    uint eventId;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    address payable owner;
    uint256 price;
    bool sold;
  }
  
  mapping(uint256 => MarketEvent) private idToMarketEvent;
  mapping(uint256 => MarketTicket) private idToMarketTicket;

  event MarketEventCreated (
    uint indexed eventId,
    string name,
    string description,
    string imageUri,
    string location,
    uint64 eventStartDate,
    address owner,
    uint[] tickets
  );

  event MarketTicketCreated (
    uint indexed ticketId,
    uint indexed eventId,
    address indexed nftContract,
    uint256 indexed tokenId,
    address seller,
    address owner,
    uint256 price,
    bool sold
  );

   /* Places an item for sale on the marketplace */
  function createEvent(
    string name,
    string description,
    string imageUri,
    string location,
    uint64 eventStartDate
  ) public nonReentrant {
      // check if thic fucntion caller is not an zero address account
    require(msg.sender != address(0));
    _eventIds.increment();
    // check if a token exists with the above token id => incremented counter
    require(!_exists(_eventIds));
    uint256 eventId = _eventIds.current();

    uint[] eventTickets;
  
    idToMarketEvent[eventId] =  MarketEvent(
      eventId,
      name,
      description,
      imageUri,
      location,
      eventStartDate,
      msg.sender,
      eventTickets
    );

    emit MarketEventCreated(
      eventId,
      name,
      description,
      imageUri,
      location,
      eventStartDate,
      msg.sender,
      eventTickets
    );
  }

  /* Getters */
  /// @title A title that should describe the contract/interface
  /// @author The name of the author
  /// @notice Explain to an end user what this does
  /// @dev Explain to a developer any extra details
  
  /* Returns only events that a user has created */
  function getMyEvents() public view returns (MarketEvent[] memory) {
    uint totalEventCount = _eventIds.current();
    uint eventCount = 0;
    uint currentIndex = 0;

    for (uint i = 0; i < totalEventCount; i++) {
      if (idToMarketEvent[i + 1].owner == msg.sender) {
        eventCount += 1;
      }
    }

    MarketEvent[] memory userEvents = new MarketEvent[](eventCount);
    for (uint i = 0; i < totalEventCount; i++) {
      if (idToMarketEvent[i + 1].owner == msg.sender) {
        uint currentId = i + 1;
        MarketEvent storage currentEvent = idToMarketEvent[currentId];
        userEvents[currentIndex] = currentEvent;
        currentIndex += 1;
      }
    }
    return userEvents;
  }

  

  //Required functions to receive ERC1155 tokens
  function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes calldata data) override external returns (bytes4) {
      return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
  }
  
  function onERC1155BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes calldata data) override external returns (bytes4) {
      bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"));
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
      return super.supportsInterface(interfaceId);
  }
}


/**
    Will have purchase NFT Ticket by taking ID of ticket type you want to buy and amount as parameters
    This function will check that the marketplace has enough balance of the NFT for the amount you want to purchase
    You check if the buyer sent a moeney and transer from the marketplace address which is "address(this)" to buyer

    The marketplace will call the event contract and ticket contract to make new versions of each - or maybe event isn't needed and can be stored in marketplace
    I will append the new ticket to ticket array, then I will set the tickets ID to its place in the array. Ticket constructer will have marketplace address, and ticket script will have createToken
    function which takes in tokenID, amount, eventID

    We'll have a var called total tickets which is set to tickets array length
    We'll also have a var called ticket supply which is the available tickets we for an event which event owner has ability to change by being able to add extra or remove extra tickets
    To modifiy a ticket supply, I will have the ticket contract have modify function which takes the ticket ID and either creates the extra amount, or deletes extra amount if 

    The user will be miniting the nft themselves so we can keep track of original owner and this will get transferrred to the marketplace immediately in the nft contract.
    Then our code will pass these details to the marketplace contract which keeps track of the nftcontract in order to transfer the nft to the market address, and to know the token id and creator
    NFT is minted first, then we go to the market and create the market ticket

    To store tickets and events I can loop through map each time, then check if each index is free. Think I need to give users the option to burn tickets. Maybe
    also find a way to delete all unpurchased events after data of event passes

    To get events tickets availiable just loop through each ticketID in the event's ticket array, than add to a counter the balance the marketplace has of that token/ticket

    EVENT CONTRACT
    He has an array of tickets which has a datatype of things like price etc. Then when someoen buys a ticket, a new ticket type is created and given the id of its place in the array,
    and then a new NFT is minted and its tokenID is the place in the array of the ticket, and the minted owner of the nft is the purchaser

    OTHER GUYS CONTRACT
    Each NFT has its own script associated with it, so when someone creates a token, they are also creating a new NFT contract
    He has a mapping of ids->MarketTicket to store all the market items in the market. Each item as its own market item id and a seperate token ID
    TokenID is given with a counter within the nft contract

    As user has access to the NFT contract and can mint the NFT, 
    Set approval for all gives another contract(e.g. our marketplace) the ability transfact the token to differen users.
    We also return the token id so that in the front end we can do stuff with the token id such as put it for sale

    So to list an item on the market, a user will interact with the front ent and he mints the nft, then we transfer that nft from the user to the marketplace

    balanceOf checks the quantity of a specific token that a contract has x
 */

