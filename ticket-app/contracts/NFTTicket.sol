 // SPDX-License-Identifier: MIT
 pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol';


import "hardhat/console.sol";

contract NFTTicket is ERC1155PresetMinterPauser, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address contractAddress;

    mapping(uint256 => string) private _uris;

     event NFTTicketCreated (
        uint indexed tokenId
    );

    //orginal uri for 1155 must end in {id}.json which is done to save gas, but this format isn't widely accepted e.g. not by opensea
    constructor(address marketplaceAddress) ERC1155PresetMinterPauser("") {
        contractAddress = marketplaceAddress;
    }

    function createToken(uint64 amount, uint256 eventId) public returns (uint) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        //use eventID for the metadata

        //TODO - Add a check to see token creator owns the event, but then again i can just check this on market contract and not allow listing if token owner doesn't match event owner - ok i'll do this lols

        _mint(msg.sender, newTokenId, amount, "");
        setApprovalForAll(contractAddress, true);

        emit NFTTicketCreated(
            newTokenId
        );
        return newTokenId;
    }

    //What this function does is allow a custom uri for a token which doesn't need to follow {id} structure
    function uri(uint256 tokenID) override public view returns (string memory) {
            //TODO - "Strings" throws an error
        return(_uris[tokenID]);
    }

    function setTokenUri(uint256 tokenId, string memory uri) public onlyOwner{
        //allow you to only ever set the token uri once by requiring that the string mapped to the tokenId is empty
        require(bytes(_uris[tokenId]).length == 0, "You cannot set token uri twice");
        _uris[tokenId] = uri;
    }
}

/**
    Marketplace{
        All events
    }
    Event{
        Name
        Description
        Start Date
        Creator
    }
    Ticket{
        Event ID
        Price
        Owner
        *Availability
    }
    *Create an empty event
    *We must map all the events to the correct creater
    //Withdraw is used to make sure you are the only one who can withdraw from a contract
    Ticket contract just mints the required amount of your asset with an ID alongside it, e.g. 1 for SWORD, 2 for ARMOUR
    https://www.youtube.com/watch?v=PakCemMvY58&list=LL&index=20
 */