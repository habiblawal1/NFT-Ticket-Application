// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol";

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

    event NFTTicketCreated(uint256 indexed tokenId);

    //orginal uri for 1155 must end in {id}.json which is done to save gas, but this format isn't widely accepted e.g. not by opensea
    constructor(address marketplaceAddress) ERC1155PresetMinterPauser("") {
        contractAddress = marketplaceAddress;
    }

    function createToken(string memory newUri, uint64 amount)
        public
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId, amount, "");
        setApprovalForAll(contractAddress, true);
        //Makes msg.sender the owner so that now they are the only ones capable of setting token uri
        _NFTInfo[newTokenId].owner = msg.sender;
        _NFTInfo[newTokenId].uri = newUri;
        emit NFTTicketCreated(newTokenId);
        return newTokenId;
    }

    function addTokens(uint256 tokenId, uint64 amount) public {
        require(
            _NFTInfo[tokenId].owner == msg.sender,
            "Only token owner can mint extra tokens"
        );
        _mint(msg.sender, tokenId, amount, "");
        setApprovalForAll(contractAddress, true);
    }

    //What this function does is allow a custom uri for a token which doesn't need to follow {id} structure
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(
            bytes(_NFTInfo[tokenId].uri).length != 0,
            "No uri exists for the token"
        );
        return (_NFTInfo[tokenId].uri);
    }

    function giveResaleApproval(uint256 tokenId) public {
        require(
            balanceOf(msg.sender, tokenId) > 0,
            "You must own this NFT in order to resell it"
        );
        setApprovalForAll(contractAddress, true);
        return;
    }
}
