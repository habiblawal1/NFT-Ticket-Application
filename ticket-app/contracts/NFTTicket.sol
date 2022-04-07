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

    struct NFTInfo {
        string uri;
        address owner;
    }
    mapping(uint256 => NFTInfo) private _NFTInfo;

     event NFTTicketCreated (
        uint indexed tokenId
    );

    //orginal uri for 1155 must end in {id}.json which is done to save gas, but this format isn't widely accepted e.g. not by opensea
    constructor(address marketplaceAddress) ERC1155PresetMinterPauser("") {
        contractAddress = marketplaceAddress;
    }

    function createToken(uint64 amount) public returns (uint) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId, amount, "");
        setApprovalForAll(contractAddress, true);
        //Makes msg.sender the owner so that now they are the only ones capable of 
        _NFTInfo[newTokenId].owner = msg.sender;
        emit NFTTicketCreated(
            newTokenId
        );
        return newTokenId;
    }

    // //What this function does is allow a custom uri for a token which doesn't need to follow {id} structure
    function uri(uint256 tokenId) override public view returns (string memory) {
        require(bytes(_NFTInfo[tokenId].uri).length != 0, "No uri exists for the token, please create one using the setTokenUri function");
        return(_NFTInfo[tokenId].uri);
    }

    function setTokenUri(uint256 tokenId, string memory newUri) public{
        require(_NFTInfo[tokenId].owner == msg.sender, "Only token owner can set uri");
        //allow you to only ever set the token uri once by requiring that the string mapped to the tokenId is empty
        require(bytes(_NFTInfo[tokenId].uri).length == 0, "You cannot set token uri twice");
       _NFTInfo[tokenId].uri = newUri;
    }

    function giveResaleApproval(uint256 tokenId) public { 
        require(balanceOf(msg.sender, tokenId) > 0, "You must own this NFT in order to resell it" ); 
        setApprovalForAll(contractAddress, true); 
        return; 
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