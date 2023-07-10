import { expect } from "chai";
import { BotEntrypoint } from "../typechain-types/contracts/BotEntrypoint";
import { ERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20/ERC20";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import exp from "constants";


const wETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const uniswapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const inversionQuantity = ethers.utils.parseEther("0.1");
const tokenToBuy = "0x9d68f97e656AFEFAf63f200FB1C4518Cf2b24A78";

describe('BotEntrypoint', () => {
    let contract: BotEntrypoint;
    let admin: string;
    let bot: string;
    let notAuthorized: string;
    let wETHContract: ERC20;
    let buyToken: ERC20;

    beforeEach(async () => {
        const ERC20 = await ethers.getContractFactory("ERC20");

        wETHContract = ERC20.attach(wETHAddress);
        buyToken = ERC20.attach(tokenToBuy);

        contract = await deployContract();
        await fund(contract.address, ethers.utils.parseUnits("1", "ether"));
        [admin, bot, notAuthorized] = (
            await ethers.getSigners()
          ).map((signer: SignerWithAddress) => signer.address);
    });

    it('admin should be setted', async () => {
        expect(await contract.hasRole(await contract.DEFAULT_ADMIN_ROLE(), admin)).to.be.equal(true);
    });

    it('admin can set bot role', async () => {
        await contract.grantRole(await contract.BOT_ROLE(), bot);
    
        expect(await contract.hasRole(await contract.BOT_ROLE(), bot)).to.be.equal(true);
    });

    it('wEth should be setted', async () => {
        expect(await contract.wETH()).to.be.equal(wETHAddress);
    });

    it('dex should be setted', async () => {
        expect(await contract.dexRouter()).to.be.equal(uniswapRouter);
    })

    it('inversion quantity should be setted', async () => {
        expect(await contract.inversionQuantity()).to.be.equal(inversionQuantity);
    });

    it('bot can buy', async () => {
        await contract.grantRole(await contract.BOT_ROLE(), bot);
        await contract.connect(await ethers.getSigner(bot)).buyEntryPointBot(tokenToBuy);

        expect(await wETHContract.balanceOf(contract.address)).to.be.equal(ethers.utils.parseUnits("0.9", "ether"));
        expect(await buyToken.balanceOf(contract.address)).to.be.equal(ethers.utils.parseUnits("1109035802314242498951", "wei"));
    })

    it('not authorized can not buy', async () => {
        await expect(contract.connect(await ethers.getSigner(notAuthorized)).buyEntryPointBot(tokenToBuy)).to.be.revertedWith(/AccessControl/);
    })

    it('bot can sell', async () => {
        await contract.grantRole(await contract.BOT_ROLE(), bot);
        await contract.connect(await ethers.getSigner(bot)).buyEntryPointBot(tokenToBuy);
        await contract.connect(await ethers.getSigner(bot)).sellEntryPointBot(tokenToBuy);

        expect(await wETHContract.balanceOf(contract.address)).to.be.equal(ethers.utils.parseUnits("999410190063032374", "wei"));
        expect(await buyToken.balanceOf(contract.address)).to.be.equal(ethers.utils.parseUnits("0", "wei"));
    })

    it('not authorized can not sell', async () => {
        await expect(contract.connect(await ethers.getSigner(notAuthorized)).sellEntryPointBot(tokenToBuy)).to.be.revertedWith("BotEntrypoint: ONLY BOT OR ME");
    })

    it('admin can redeem', async () => {
        await contract.grantRole(await contract.BOT_ROLE(), bot);


        await contract.connect(await ethers.getSigner(admin)).redeemWETH(ethers.utils.parseUnits("1", "ether"));

        expect(await wETHContract.balanceOf(contract.address)).to.be.equal(ethers.utils.parseUnits("0", "wei"));
        expect(await wETHContract.balanceOf(admin)).to.be.equal(ethers.utils.parseUnits("1", "ether"));
    })

    it('not authorized can not redeem', async () => {
        await expect(contract.connect(await ethers.getSigner(notAuthorized)).redeemWETH(ethers.utils.parseUnits("1", "ether"))).to.be.revertedWith(/AccessControl/);
    })

    it ('shouldShell return false if the token not duplicate the entry price', async () => {
        await contract.grantRole(await contract.BOT_ROLE(), bot);
        await contract.connect(await ethers.getSigner(bot)).buyEntryPointBot(tokenToBuy);

        expect(await contract.shouldShell(tokenToBuy)).to.be.equal(false);

    })

});

async function deployContract(

  ): Promise<BotEntrypoint> {
    const botEntrypointFactory =
      await ethers.getContractFactory("BotEntrypoint");
    const contract = await botEntrypointFactory.deploy(
      uniswapRouter,
      wETHAddress,
      inversionQuantity,
    );
    return contract;
}


async function fund(address: string, amount: BigNumber) {
    const holderAddress = "0x99509E88aeAe37AaC31Ed2e1e7f9B315353180E7"

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [holderAddress],
    });

    const signer = await ethers.provider.getSigner(holderAddress);

   
    const ERC20 = await ethers.getContractFactory("ERC20");

    const token = ERC20.attach(wETHAddress);

    await token.connect(signer).transfer(address, amount);

    const newBalance = await token.balanceOf(address);

}
  