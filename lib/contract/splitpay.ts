import {
  Account,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
  Address,
  BASE_FEE,
  rpc,
  TimeoutInfinite,
} from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '../stellar/config';
import { getRpcServer, loadAccount, pollTransactionStatus } from '../stellar/rpc';
import { Pool, PoolStatus, Member, Payment, PaymentStatus, Distribution } from '@/types';

// Valid dummy Stellar account used for Soroban read-only simulation calls
const DUMMY_SIMULATION_ACCOUNT = new Account(
  'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
  '0'
);

export class SplitPayContractClient {
  private contractId: string;
  private server: rpc.Server;

  constructor(contractId?: string) {
    this.contractId = contractId || STELLAR_CONFIG.contractId;
    this.server = getRpcServer();
  }

  getContractId(): string {
    if (!this.contractId) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('splitpay_contract_id');
        if (stored) this.contractId = stored;
      }
      if (!this.contractId) {
        this.contractId = STELLAR_CONFIG.contractId;
      }
    }
    return this.contractId;
  }

  setContractId(id: string) {
    this.contractId = id;
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem('splitpay_contract_id', id);
    }
  }

  /**
   * Helper to build and simulate a read-only contract call.
   */
  async simulateCall(method: string, args: xdr.ScVal[] = []): Promise<xdr.ScVal | null> {
    const contractId = this.getContractId();
    if (!contractId) {
      throw new Error('SplitPay contract ID is not configured.');
    }

    const contract = new Contract(contractId);

    const tx = new TransactionBuilder(DUMMY_SIMULATION_ACCOUNT, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(TimeoutInfinite)
      .build();

    const sim = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      return sim.result.retval;
    }
    return null;
  }

  /**
   * Helper to build an invocable transaction ready for wallet signing.
   */
  async prepareInvocationTx(
    signerAddress: string,
    method: string,
    args: xdr.ScVal[]
  ): Promise<string> {
    const contractId = this.getContractId();
    if (!contractId) {
      throw new Error('SplitPay contract ID is not configured.');
    }

    const account = await loadAccount(signerAddress);
    const contract = new Contract(contractId);

    const tx = new TransactionBuilder(account, {
      fee: (parseInt(BASE_FEE) * 10).toString(),
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(300)
      .build();

    const sim = await this.server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(sim)) {
      throw new Error(`Simulation failed: ${sim.error}`);
    }

    if (!rpc.Api.isSimulationSuccess(sim)) {
      throw new Error('Simulation failed to produce a valid execution result.');
    }

    const assembled = rpc.assembleTransaction(tx, sim);
    return assembled.build().toXDR();
  }

  /**
   * Submit signed transaction XDR and wait for confirmation.
   */
  async submitSignedTx(signedXdr: string): Promise<{ txHash: string }> {
    const tx = TransactionBuilder.fromXDR(signedXdr, STELLAR_CONFIG.networkPassphrase);
    const sendRes = await this.server.sendTransaction(tx);

    if (sendRes.status === 'ERROR') {
      const errDetail = sendRes.errorResult?.toXDR('hex') || 'Unknown RPC error';
      throw new Error(`Transaction submission rejected: ${errDetail}`);
    }

    // Wait for on-chain inclusion
    await pollTransactionStatus(sendRes.hash);
    return { txHash: sendRes.hash };
  }

  // -------------------------------------------------------------
  // Contract Methods (Read)
  // -------------------------------------------------------------

  /**
   * get_pool(pool_id: u64) -> Pool
   */
  async getPool(poolId: string | number): Promise<Pool | null> {
    try {
      const poolIdVal = nativeToScVal(BigInt(poolId), { type: 'u64' });
      const val = await this.simulateCall('get_pool', [poolIdVal]);
      if (!val) return null;

      const raw = scValToNative(val);
      return {
        id: poolId.toString(),
        owner: raw.owner.toString(),
        asset: raw.asset.toString(),
        status: Number(raw.status) === 1 ? PoolStatus.Active : PoolStatus.Inactive,
        createdAt: Number(raw.created_at || raw.createdAt || 0),
      };
    } catch {
      return null;
    }
  }

  /**
   * get_pool_members(pool_id: u64) -> Vec<Member>
   */
  async getPoolMembers(poolId: string | number): Promise<Member[]> {
    try {
      const poolIdVal = nativeToScVal(BigInt(poolId), { type: 'u64' });
      const val = await this.simulateCall('get_pool_members', [poolIdVal]);
      if (!val) return [];

      const raw = scValToNative(val);
      if (!Array.isArray(raw)) return [];

      return raw.map((item: any) => ({
        poolId: poolId.toString(),
        address: item.address.toString(),
        shareBps: Number(item.share_bps ?? item.shareBps ?? 0),
      }));
    } catch {
      return [];
    }
  }

  /**
   * get_member(pool_id: u64, address: Address) -> Member
   */
  async getMember(poolId: string | number, memberAddress: string): Promise<Member | null> {
    try {
      const poolIdVal = nativeToScVal(BigInt(poolId), { type: 'u64' });
      const addressVal = new Address(memberAddress).toScVal();
      const val = await this.simulateCall('get_member', [poolIdVal, addressVal]);
      if (!val) return null;

      const raw = scValToNative(val);
      return {
        poolId: poolId.toString(),
        address: raw.address.toString(),
        shareBps: Number(raw.share_bps ?? raw.shareBps ?? 0),
      };
    } catch {
      return null;
    }
  }

  /**
   * get_payment(payment_id: u64) -> Payment
   */
  async getPayment(paymentId: string | number): Promise<Payment | null> {
    try {
      const paymentIdVal = nativeToScVal(BigInt(paymentId), { type: 'u64' });
      const val = await this.simulateCall('get_payment', [paymentIdVal]);
      if (!val) return null;

      const raw = scValToNative(val);
      return {
        id: paymentId.toString(),
        poolId: (raw.pool_id ?? raw.poolId).toString(),
        payer: raw.payer.toString(),
        asset: raw.asset.toString(),
        amount: BigInt(raw.amount.toString()),
        status: Number(raw.status) === 2 ? PaymentStatus.Settled : PaymentStatus.Pending,
        createdAt: Number(raw.created_at ?? raw.createdAt ?? 0),
      };
    } catch {
      return null;
    }
  }

  /**
   * get_distributions(payment_id: u64) -> Vec<Distribution>
   */
  async getDistributions(paymentId: string | number): Promise<Distribution[]> {
    try {
      const paymentIdVal = nativeToScVal(BigInt(paymentId), { type: 'u64' });
      const val = await this.simulateCall('get_distributions', [paymentIdVal]);
      if (!val) return [];

      const raw = scValToNative(val);
      if (!Array.isArray(raw)) return [];

      return raw.map((item: any) => ({
        paymentId: paymentId.toString(),
        recipient: item.recipient.toString(),
        amount: BigInt(item.amount.toString()),
        shareBps: Number(item.share_bps ?? item.shareBps ?? 0),
      }));
    } catch {
      return [];
    }
  }

  // -------------------------------------------------------------
  // Contract Invocations (Write - Generates XDR for signing)
  // -------------------------------------------------------------

  /**
   * create_pool(pool_id: u64, owner: Address, asset: Address)
   */
  async prepareCreatePool(
    signerAddress: string,
    poolId: string | number,
    ownerAddress: string,
    assetAddress: string
  ): Promise<string> {
    const args = [
      nativeToScVal(BigInt(poolId), { type: 'u64' }),
      new Address(ownerAddress).toScVal(),
      new Address(assetAddress).toScVal(),
    ];
    return this.prepareInvocationTx(signerAddress, 'create_pool', args);
  }

  /**
   * add_member(pool_id: u64, address: Address, share_bps: u32)
   */
  async prepareAddMember(
    signerAddress: string,
    poolId: string | number,
    memberAddress: string,
    shareBps: number
  ): Promise<string> {
    const args = [
      nativeToScVal(BigInt(poolId), { type: 'u64' }),
      new Address(memberAddress).toScVal(),
      nativeToScVal(shareBps, { type: 'u32' }),
    ];
    return this.prepareInvocationTx(signerAddress, 'add_member', args);
  }

  /**
   * remove_member(pool_id: u64, address: Address)
   */
  async prepareRemoveMember(
    signerAddress: string,
    poolId: string | number,
    memberAddress: string
  ): Promise<string> {
    const args = [
      nativeToScVal(BigInt(poolId), { type: 'u64' }),
      new Address(memberAddress).toScVal(),
    ];
    return this.prepareInvocationTx(signerAddress, 'remove_member', args);
  }

  /**
   * update_member_share(pool_id: u64, address: Address, share_bps: u32)
   */
  async prepareUpdateMemberShare(
    signerAddress: string,
    poolId: string | number,
    memberAddress: string,
    shareBps: number
  ): Promise<string> {
    const args = [
      nativeToScVal(BigInt(poolId), { type: 'u64' }),
      new Address(memberAddress).toScVal(),
      nativeToScVal(shareBps, { type: 'u32' }),
    ];
    return this.prepareInvocationTx(signerAddress, 'update_member_share', args);
  }

  /**
   * set_pool_status(pool_id: u64, status: PoolStatus)
   */
  async prepareSetPoolStatus(
    signerAddress: string,
    poolId: string | number,
    status: PoolStatus
  ): Promise<string> {
    const args = [
      nativeToScVal(BigInt(poolId), { type: 'u64' }),
      nativeToScVal(status === PoolStatus.Active ? 1 : 2, { type: 'u32' }),
    ];
    return this.prepareInvocationTx(signerAddress, 'set_pool_status', args);
  }

  /**
   * create_payment(payment_id: u64, pool_id: u64, payer: Address, amount: i128)
   */
  async prepareCreatePayment(
    signerAddress: string,
    paymentId: string | number,
    poolId: string | number,
    payerAddress: string,
    amount: bigint
  ): Promise<string> {
    const args = [
      nativeToScVal(BigInt(paymentId), { type: 'u64' }),
      nativeToScVal(BigInt(poolId), { type: 'u64' }),
      new Address(payerAddress).toScVal(),
      nativeToScVal(amount, { type: 'i128' }),
    ];
    return this.prepareInvocationTx(signerAddress, 'create_payment', args);
  }

  /**
   * settle_payment(payment_id: u64)
   */
  async prepareSettlePayment(signerAddress: string, paymentId: string | number): Promise<string> {
    const args = [nativeToScVal(BigInt(paymentId), { type: 'u64' })];
    return this.prepareInvocationTx(signerAddress, 'settle_payment', args);
  }
}

export const splitPayClient = new SplitPayContractClient();
