// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const tokenAddress = '0x5841452D116cD26b6aC448df41dE35F7793b49bb';

const LockModule = buildModule("LockModule", (m) => {

  const lock = m.contract("Credlink", [tokenAddress]);

  return { lock };
});

export default LockModule;