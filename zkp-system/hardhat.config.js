require("@nomicfoundation/hardhat-toolbox");
require("hardhat-circom");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.6.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    localhost: {
      url: "http://localhost:8545",
      chainId: 15555,
      accounts: [
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        "0x0000000000000000000000000000000000000000000000000000000000000003",
        "0x0000000000000000000000000000000000000000000000000000000000000004",
        "0x0000000000000000000000000000000000000000000000000000000000000005"
      ]
    },
    hardhat: {
      chainId: 15555
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  circom: {
    inputBasePath: "./circuits",
    outputBasePath: "./circuits/compiled",
    ptau: "pot12_final.ptau",
    circuits: [
      { name: "simple-ielts", circuit: "simple-ielts.circom" }
    ]
  }
};
