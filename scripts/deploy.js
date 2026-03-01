const { ethers } = require('ethers')
const solc = require('solc')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

function compile() {
  const source = fs.readFileSync(
    path.join(__dirname, '../contracts/EProof.sol'),
    'utf8'
  )

  const input = {
    language: 'Solidity',
    sources: { 'EProof.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } },
  }

  const output = JSON.parse(solc.compile(JSON.stringify(input)))

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error')
    if (errors.length > 0) {
      console.error('Compilation errors:')
      errors.forEach(e => console.error(e.formattedMessage))
      process.exit(1)
    }
  }

  const contract = output.contracts['EProof.sol']['EProof']
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
  }
}

async function main() {
  const rpcUrl = process.env.ETHEREUM_RPC_URL
  const privateKey = process.env.WALLET_PRIVATE_KEY

  if (!rpcUrl || !privateKey) {
    console.error('Missing ETHEREUM_RPC_URL or WALLET_PRIVATE_KEY in .env')
    process.exit(1)
  }

  console.log('Compiling EProof.sol...')
  const { abi, bytecode } = compile()
  console.log('✅ Compiled successfully')

  // Save ABI for use in blockchain.ts
  fs.writeFileSync(
    path.join(__dirname, '../contracts/EProof.abi.json'),
    JSON.stringify(abi, null, 2)
  )
  console.log('ABI saved to contracts/EProof.abi.json')

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)

  console.log('Deploying from wallet:', wallet.address)
  const balance = await provider.getBalance(wallet.address)
  console.log('Wallet balance:', ethers.formatEther(balance), 'ETH')

  if (balance === 0n) {
    console.error('Wallet has no ETH. Get Sepolia ETH from a faucet first.')
    process.exit(1)
  }

  const factory = new ethers.ContractFactory(abi, bytecode, wallet)
  console.log('Deploying contract...')

  const contract = await factory.deploy()
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('')
  console.log('✅ EProof deployed at:', address)
  console.log('')
  console.log('Add this to your .env:')
  console.log(`CONTRACT_ADDRESS="${address}"`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
