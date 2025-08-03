const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
// const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { bigint } = require("hardhat/internal/core/params/argumentTypes");

// util functon
const deployBlockMarketPlace = async () => {
  // target the BlockMarketPlace contract within our contract folder
  const [owner_, addr1, addr2] = await ethers.getSigners();
  const BlockMarketPlaceContract = await ethers.getContractFactory(
    "BlockMarketPlace"
  ); // target BlockMarketPlace.sol
  const BlockNftContract = await ethers.getContractFactory("BlockNft");
  const BlockTokenContract = await ethers.getContractFactory("BlockToken");
  let name_ = "BlockToken";
  let symbol_ = "BCT";
  const BlockToken = await BlockTokenContract.deploy(
    name_,
    symbol_,
    owner_.address
  ); // deploy the BlockToken contract
  const blocknft = await BlockNftContract.deploy();
  const marketplace = await BlockMarketPlaceContract.connect(owner_).deploy();
  // deploy the BlockMarketPlace contract
  return { marketplace, blocknft, BlockToken, owner_, addr1, addr2 }; // return the deployed instance of our BlockMarketPlace contract
};

describe("BlockMarketPlace Test Suite", () => {
  describe("Deployment", () => {
    it("Should return set values upon deployment", async () => {
      const { marketplace, owner_ } = await loadFixture(deployBlockMarketPlace);
      expect(await marketplace.marketOwner()).to.eq(owner_);
    });
  });

  describe("Listing", () => {
    it("Should list Nft accordingly", async () => {
      const { marketplace, addr1, BlockToken, blocknft } = await loadFixture(
        deployBlockMarketPlace
      );
      let tokenId = 1;
      await blocknft.connect(addr1).mint(addr1);
      let token = await ethers.getContractAt("IERC20", BlockToken);
      await blocknft
        .connect(addr1)
        .setApprovalForAll(marketplace.getAddress(), true);
      await marketplace.connect(addr1).listNft({
        owner: addr1,
        tokenId: tokenId,
        paymentToken: token,
        NftToken: blocknft.getAddress(),
        isNative: false,
        price: 100000,
        sold: false,
        minOffer: 10,
      });

      expect(await blocknft.ownerOf(tokenId)).to.eq(
        await marketplace.getAddress()
      );
    });

    it("Should revert upon setting unaccepted values", async () => {
      const { marketplace, addr1, BlockToken, blocknft } = await loadFixture(
        deployBlockMarketPlace
      );
      let tokenId = 1;
      await blocknft.connect(addr1).mint(addr1);
      let token = await ethers.getContractAt("IERC20", BlockToken);
      await blocknft
        .connect(addr1)
        .setApprovalForAll(marketplace.getAddress(), true);
      let tx1 = marketplace.connect(addr1).listNft({
        owner: addr1,
        tokenId: tokenId,
        paymentToken: token,
        NftToken: blocknft.getAddress(),
        isNative: false,
        price: 0,
        sold: false,
        minOffer: 10,
      });

      await expect(tx1).to.be.revertedWith("Invalid price");
      //   tx2
      let tx2 = marketplace.connect(addr1).listNft({
        owner: addr1,
        tokenId: tokenId,
        paymentToken: token,
        NftToken: blocknft.getAddress(),
        isNative: false,
        price: 10000,
        sold: false,
        minOffer: 0,
      });

      await expect(tx2).to.be.revertedWith("Invalid min offer");

      //   tx3
      let tx3 = marketplace.connect(addr1).listNft({
        owner: addr1,
        tokenId: tokenId,
        paymentToken: token,
        NftToken: blocknft.getAddress(),
        isNative: true,
        price: 10000,
        sold: false,
        minOffer: 10,
      });

      await expect(tx3).to.be.revertedWith("ERC20 Payment is not supported");

      let ZeroAddress = "0x0000000000000000000000000000000000000000";
      marketplace.connect(addr1).listNft({
        owner: addr1,
        tokenId: tokenId,
        paymentToken: ZeroAddress,
        NftToken: blocknft.getAddress(),
        isNative: true,
        price: 10000,
        sold: false,
        minOffer: 10,
      });

      let [, , paymentToken, , ,] = await marketplace.getListing(1);
      console.log(paymentToken);

      expect(await paymentToken).to.eq(ZeroAddress);
    });
  });

  describe("buyNft", () => {
    it(" with native ETH", async () => {
      const { marketplace, addr1, blocknft, addr2 } = await loadFixture(
        deployBlockMarketPlace
      );

      let tokenId = 1;
      await blocknft.connect(addr1).mint(addr1);

      await blocknft
        .connect(addr1)
        .setApprovalForAll(marketplace.getAddress(), true);

      let listId = 0;
      let ZeroAddress = "0x0000000000000000000000000000000000000000";

      await marketplace.connect(addr1).listNft({
        owner: addr1,
        tokenId: tokenId,
        paymentToken: ZeroAddress,
        NftToken: blocknft.getAddress(),
        isNative: true,
        price: 10,
        sold: false,
        minOffer: 5,
      });

      await marketplace.connect(addr2).buyNft(listId, {
        value: 10,
      });

      expect(await blocknft.ownerOf(tokenId)).to.eq(addr2.address);
      expect((await marketplace.getListing(listId)).sold).to.equal(true);
    });

    it("Should revert if price is incorrect", async () => {
      const { marketplace, addr1, blocknft, addr2 } = await loadFixture(
        deployBlockMarketPlace
      );

      let tokenId = 1;
      await blocknft.connect(addr1).mint(addr1);

      await blocknft
        .connect(addr1)
        .setApprovalForAll(marketplace.getAddress(), true);

      let listId = 0;
      let ZeroAddress = "0x0000000000000000000000000000000000000000";

      await marketplace.connect(addr1).listNft({
        owner: addr1,
        tokenId: tokenId,
        paymentToken: ZeroAddress,
        NftToken: blocknft.getAddress(),
        isNative: true,
        price: 10,
        sold: false,
        minOffer: 5,
      });

      await expect(
        marketplace.connect(addr2).buyNft(listId)
      ).to.be.revertedWith("Incorrect price");
    });
    it("should buy with erc2o token", async () => {
      const { marketplace, addr1, BlockToken, blocknft, owner_, addr2 } = await loadFixture(
        deployBlockMarketPlace
      );
      // await blocknft
      //   .connect(addr1)
      //   .setApprovalForAll(marketplace.getAddress(), true);
      await BlockToken.connect()
      let tokenId = 1;
      await blocknft.connect(addr1).mint(addr1);
      let token = await ethers.getContractAt("IERC20", BlockToken);
      await blocknft
        .connect(addr1)
        .setApprovalForAll(marketplace.getAddress(), true);
      await marketplace.connect(addr1).listNft({
        owner: addr1,
        tokenId: tokenId,
        paymentToken: token,
        NftToken: blocknft.getAddress(),
        isNative: false,
        price: 100000,
        sold: false,
        minOffer: 10,
      });

      expect(await blocknft.ownerOf(tokenId)).to.eq(
        await marketplace.getAddress()
      );
      await BlockToken.connect(owner_).mint(100000, addr2)
      await BlockToken.connect(addr2).approve(await marketplace.getAddress(), 100000);

      await marketplace.connect(addr2).buyNft(0);
      expect(await blocknft.ownerOf(tokenId)).to.eq(addr2.address);
      expect((await marketplace.getListing(0)).sold).to.equal(true);
    });

  })
  
  describe("Offer", () => {
    it("native offer", async () => {
      const { marketplace, addr1, blocknft, addr2 } = await loadFixture(deployBlockMarketPlace);
  let listId = 0;
      let ZeroAddress = "0x0000000000000000000000000000000000000000";
      let tokenId = 1;
      await blocknft.connect(addr1).mint(addr1);
      await blocknft.connect(addr1).setApprovalForAll(marketplace.getAddress(), true);

      await marketplace.connect(addr1).listNft({
        owner: addr1,
        tokenId: tokenId,
        paymentToken: ZeroAddress,
        NftToken: blocknft.getAddress(),
        isNative: true,
        price: 10,
        sold: false,
        minOffer: 5,
      });

      await marketplace.connect(addr2).offer(0, 0, { value: 6 });

      const offer = await marketplace.getOffer(0);
      expect(offer.offerAmount).to.equal(6);
      expect(offer.offerrer).to.equal(addr2.address);
      expect(offer.status).to.equal(false);
    });

    it("accept a native offer", async () => {
      const { marketplace, addr1, blocknft, addr2 } = await loadFixture(deployBlockMarketPlace);

      let tokenId = 1;
       let ZeroAddress = "0x0000000000000000000000000000000000000000";
      await blocknft.connect(addr1).mint(addr1);
      await blocknft.connect(addr1).setApprovalForAll(marketplace.getAddress(), true);

      await marketplace.connect(addr1).listNft({
        owner: addr1,
        tokenId: tokenId,
        paymentToken: ZeroAddress,
        NftToken: blocknft.getAddress(),
        isNative: true,
        price: 10,
        sold: false,
        minOffer: 5,
      });

      await marketplace.connect(addr2).offer(0, 0, { value: 6 });

      await marketplace.connect(addr1).acceptOffer(0);

      expect(await blocknft.ownerOf(tokenId)).to.equal(addr2.address);
      const updatedListing = await marketplace.getListing(0);
      expect(updatedListing.sold).to.equal(true);
      const updatedOffer = await marketplace.getOffer(0);
      expect(updatedOffer.status).to.equal(true);
    });

    it("cancel offer", async () => {
      const { marketplace, addr1, blocknft, addr2 } = await loadFixture(deployBlockMarketPlace);

      let tokenId = 1;
       let ZeroAddress = "0x0000000000000000000000000000000000000000";
      await blocknft.connect(addr1).mint(addr1);
      await blocknft.connect(addr1).setApprovalForAll(marketplace.getAddress(), true);

      await marketplace.connect(addr1).listNft({
        owner: addr1,
        tokenId: tokenId,
        paymentToken: ZeroAddress,
        NftToken: blocknft.getAddress(),
        isNative: true,
        price: 10,
        sold: false,
        minOffer: 5,
      });

      await marketplace.connect(addr2).offer(0, 0, { value: 6 });

      await expect(marketplace.connect(addr2).cancelOffer(0)).to.not.be.reverted;

      const offer = await marketplace.getOffer(0);
      expect(offer.offerAmount).to.equal(0); 
      expect(offer.offerrer).to.equal(ZeroAddress);
    });
  });
});
