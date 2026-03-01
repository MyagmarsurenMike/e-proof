import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying from wallet:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Wallet balance:', ethers.formatEther(balance), 'ETH')

  const EProof = await ethers.getContractFactory('EProof')
  console.log('Deploying EProof contract...')

  const contract = await EProof.deploy()
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('✅ EProof deployed at:', address)
  console.log('')
  console.log('Add this to your .env:')
  console.log(`CONTRACT_ADDRESS="${address}"`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
