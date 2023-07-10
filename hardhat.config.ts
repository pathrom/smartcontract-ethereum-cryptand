import "@nomicfoundation/hardhat-toolbox";
import "hardhat-dependency-compiler";

const config = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth.llamarpc.com",
        blockNumber: 17245235
      }
    },
  },
};

export default config;