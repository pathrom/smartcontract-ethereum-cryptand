const hre = require("hardhat");
const ethers = require("ethers"); // Asegúrate de incluir esto para usar ethers.utils.parseEther

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", balance.toString());

  const ContractFactory = await hre.ethers.getContractFactory("BotEntrypoint");

  const dexRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const wETHAddress = ethers.utils.getAddress(
    "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"
  ); // Usamos getAddress para garantizar que la dirección tenga el checksum correcto
  const inversionQty = ethers.utils.parseEther("0.005"); // Representa 0.005 ether en wei

  const contractInstance = await ContractFactory.deploy(
    dexRouterAddress,
    wETHAddress,
    inversionQty
  );
  await contractInstance.deployed();

  console.log("Contract address:", contractInstance.address); // Aquí había un pequeño error, debería ser contractInstance.address en lugar de contract.address
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
