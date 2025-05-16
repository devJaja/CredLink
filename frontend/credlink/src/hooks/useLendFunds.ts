import { useWriteContract } from 'wagmi'
import abi from '../ABI/Credlink.json'

export function useLendFunds() {
  return useWriteContract({
    address: process.env.CREDLINK_CONTRACT_ADDRESS,
    abi,
    functionName: 'lendFunds',
  })
}
