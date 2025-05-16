// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const LockModule = buildModule("LockModule", (m) => {
  

  // const ownerAddress = "0xb725e575b82b57c73f81E51808Af1b2e8c4387bB";

  const lock = m.contract("USDT");

  return { lock };
});

export default LockModule;