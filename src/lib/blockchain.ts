import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'

const ABI_PATH = path.join(process.cwd(), 'contracts/EProof.abi.json')

function getABI() {
  return JSON.parse(fs.readFileSync(ABI_PATH, 'utf8'))
}

function getContract() {
  const rpcUrl = process.env.ETHEREUM_RPC_URL
  const privateKey = process.env.WALLET_PRIVATE_KEY
  const contractAddress = process.env.CONTRACT_ADDRESS

  if (!rpcUrl || !privateKey || !contractAddress) return null

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)
  return new ethers.Contract(contractAddress, getABI(), wallet)
}

export function isBlockchainConfigured(): boolean {
  return !!(
    process.env.ETHEREUM_RPC_URL &&
    process.env.WALLET_PRIVATE_KEY &&
    process.env.CONTRACT_ADDRESS
  )
}

/**
 * Register a document hash on Ethereum.
 * Returns transaction hash and block number, or null if blockchain is not configured.
 */
export async function registerDocument(fileHash: string): Promise<{
  transactionHash: string
  blockNumber: string
  networkId: string
} | null> {
  if (!isBlockchainConfigured()) {
    console.warn('[blockchain] Not configured — skipping on-chain registration')
    return null
  }

  const contract = getContract()!
  console.log('[blockchain] Registering document hash:', fileHash)

  const tx = await contract.registerDocument(fileHash)
  const receipt = await tx.wait()

  console.log('[blockchain] Transaction confirmed:', receipt.hash)

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber.toString(),
    networkId: 'sepolia',
  }
}

/**
 * Verify a document hash against the Ethereum contract.
 * Returns verification result, or null if blockchain is not configured.
 */
export async function verifyDocument(fileHash: string): Promise<{
  verified: boolean
  timestamp: number | null
  owner: string | null
  transactionHash?: string
} | null> {
  if (!isBlockchainConfigured()) {
    console.warn('[blockchain] Not configured — skipping on-chain verification')
    return null
  }

  const rpcUrl = process.env.ETHEREUM_RPC_URL!
  const contractAddress = process.env.CONTRACT_ADDRESS!

  // Use read-only provider for verification (no wallet needed)
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress, getABI(), provider)

  const [exists, timestamp, owner] = await contract.verifyDocument(fileHash)

  return {
    verified: exists,
    timestamp: exists ? Number(timestamp) : null,
    owner: exists ? owner : null,
  }
}
