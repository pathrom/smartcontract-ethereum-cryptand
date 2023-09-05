import "@nomicfoundation/hardhat-toolbox";
import "hardhat-dependency-compiler";

const config = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth.llamarpc.com",
        blockNumber: 17245235,
      },
    },
    goerli: {
      url: "https://goerli.infura.io/v3/1ccd51af50b243989e1d6e184ed2bd54",
      accounts: [
        "b84f84816e1c7d966abef40ba79ad7c388ec653413f8d789d54d67262dea8e30",
      ],
    },
  },
};

export default config;
