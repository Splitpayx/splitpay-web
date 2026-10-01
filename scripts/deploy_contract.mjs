import { Keypair, rpc, TransactionBuilder, BASE_FEE, Operation, Address, TimeoutInfinite, xdr } from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const PASSPHRASE = 'Test SDF Network ; September 2015';
const server = new rpc.Server(RPC_URL);

// Deployer keypair
const SECRET = 'SC2ALIXUH3I3HRB5DD5DGRJU53E7HHUYW5MIGPXQIN5ESM34IPIXFKA7';
const keypair = Keypair.fromSecret(SECRET);
const WASM_HASH = 'ec0ba38e7a2dc2b01947c53e260642f55da8d9bf760fb0c39cb76c756215e263';

async function waitForTx(hash) {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: { hash },
      }),
    });
    const data = await res.json();
    if (data.result && data.result.status !== 'NOT_FOUND') {
      return data.result;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timeout waiting for transaction ${hash}`);
}

async function main() {
  console.log(`Deployer Public Key: ${keypair.publicKey()}`);

  let account = await server.getAccount(keypair.publicKey());
  console.log('Account loaded, sequence:', account.sequence);

  // Step 2: Create Contract Instance
  console.log('Building create contract transaction...');
  const createOp = Operation.createCustomContract({
    address: Address.fromString(keypair.publicKey()),
    wasmHash: Buffer.from(WASM_HASH, 'hex'),
  });

  let tx = new TransactionBuilder(account, {
    fee: (parseInt(BASE_FEE) * 100).toString(),
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(createOp)
    .setTimeout(TimeoutInfinite)
    .build();

  console.log('Simulating create contract transaction...');
  let sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }

  const contractAddress = Address.fromScVal(sim.result.retval).toString();
  console.log(`Expected Contract Address: ${contractAddress}`);

  let assembled = rpc.assembleTransaction(tx, sim).build();
  assembled.sign(keypair);

  console.log('Sending create contract transaction...');
  let sendRes = await server.sendTransaction(assembled);
  if (sendRes.status === 'ERROR') {
    throw new Error(`sendTransaction error: ${JSON.stringify(sendRes)}`);
  }

  console.log(`Create tx sent, hash: ${sendRes.hash}. Waiting...`);
  let txResult = await waitForTx(sendRes.hash);
  if (txResult.status !== 'SUCCESS') {
    throw new Error(`Create contract failed: ${JSON.stringify(txResult)}`);
  }

  console.log(`===> CONTRACT DEPLOYED AT: ${contractAddress}`);

  // Step 3: Initialize Contract
  account = await server.getAccount(keypair.publicKey());
  console.log(`Initializing contract ${contractAddress} with admin: ${keypair.publicKey()}...`);
  const initOp = Operation.invokeContractFunction({
    contract: contractAddress,
    function: 'initialize',
    args: [new Address(keypair.publicKey()).toScVal()],
  });

  tx = new TransactionBuilder(account, {
    fee: (parseInt(BASE_FEE) * 100).toString(),
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(initOp)
    .setTimeout(TimeoutInfinite)
    .build();

  sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Init simulation failed: ${sim.error}`);
  }

  assembled = rpc.assembleTransaction(tx, sim).build();
  assembled.sign(keypair);

  sendRes = await server.sendTransaction(assembled);
  if (sendRes.status === 'ERROR') {
    throw new Error(`sendTransaction error: ${JSON.stringify(sendRes)}`);
  }

  console.log(`Init tx sent, hash: ${sendRes.hash}. Waiting...`);
  txResult = await waitForTx(sendRes.hash);
  if (txResult.status !== 'SUCCESS') {
    throw new Error(`Init failed: ${JSON.stringify(txResult)}`);
  }

  console.log('===> CONTRACT INITIALIZED SUCCESSFULLY!');
  console.log(`FINAL_SPLITPAY_CONTRACT_ID=${contractAddress}`);
  console.log(`ADMIN_ADDRESS=${keypair.publicKey()}`);
}

main().catch(console.error);
