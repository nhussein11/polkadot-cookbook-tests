# Add NFT Pallet to Polkadot SDK Runtime

This tutorial uses the Kitchensink parachain runtime in this repository as the base and integrates FRAME `pallet-nfts`.

## Quick steps

```bash
# 1) Build the runtime
cd kitchensink-parachain
cargo build --release

# 2) Generate a chain spec from the freshly built WASM
chain-spec-builder create -t development --relay-chain paseo --para-id 1000 \
  --runtime ./target/release/wbuild/parachain-template-runtime/parachain_template_runtime.compact.compressed.wasm \
  named-preset development

# 3) Start Omni Node with the new spec
polkadot-omni-node --chain ./chain_spec.json --dev --dev-block-time 1000

# 4) In Polkadot-JS Apps: connect to ws://127.0.0.1:9944 and check Developer -> Extrinsics for `nfts`
```

## Goal
- Enable `pallet-nfts` in Kitchensink runtime
- Configure minimal parameters
- Build and run the node; verify NFT pallet presence

## Prerequisites
- Node.js 20+
- Basic Rust and Polkadot SDK knowledge
- Optional: `polkadot-omni-node` to run a local node

## Steps (Kitchensink runtime)

1. Enable the feature in `kitchensink-parachain/runtime/Cargo.toml`:
   - Add `"pallet-nfts"` to the `polkadot-sdk` features list under `[dependencies]`.

   ```diff
    -polkadot-sdk = { workspace = true, features = ["pallet-utility", "cumulus-pallet-aura-ext", "cumulus-pallet-session-benchmarking", "cumulus-pallet-weight-reclaim", "cumulus-pallet-xcm", "cumulus-pallet-xcmp-queue", "cumulus-primitives-aura", "cumulus-primitives-core", "cumulus-primitives-utility", "pallet-aura", "pallet-authorship", "pallet-balances", "pallet-collator-selection", "pallet-message-queue", "pallet-session", "pallet-sudo", "pallet-timestamp", "pallet-transaction-payment", "pallet-transaction-payment-rpc-runtime-api", "pallet-xcm", "parachains-common", "polkadot-parachain-primitives", "polkadot-runtime-common", "runtime", "staging-parachain-info", "staging-xcm", "staging-xcm-builder", "staging-xcm-executor"], default-features = false }
    +polkadot-sdk = { workspace = true, features = ["pallet-utility", "cumulus-pallet-aura-ext", "cumulus-pallet-session-benchmarking", "cumulus-pallet-weight-reclaim", "cumulus-pallet-xcm", "cumulus-pallet-xcmp-queue", "cumulus-primitives-aura", "cumulus-primitives-core", "cumulus-primitives-utility", "pallet-aura", "pallet-authorship", "pallet-balances", "pallet-nfts", "pallet-collator-selection", "pallet-message-queue", "pallet-session", "pallet-sudo", "pallet-timestamp", "pallet-transaction-payment", "pallet-transaction-payment-rpc-runtime-api", "pallet-xcm", "parachains-common", "polkadot-parachain-primitives", "polkadot-runtime-common", "runtime", "staging-parachain-info", "staging-xcm", "staging-xcm-builder", "staging-xcm-executor"], default-features = false }
   ```

2. Configure the pallet in `kitchensink-parachain/runtime/src/lib.rs`:

    ```diff 
    --- a/kitchensink-parachain/runtime/src/lib.rs
    +++ b/kitchensink-parachain/runtime/src/lib.rs
    @@ -319,6 +319,10 @@ mod runtime {
    
        #[runtime::pallet_index(52)]
        pub type CustomPallet = custom_pallet;
    +
    +       // NFTs
    +       #[runtime::pallet_index(53)]
    +       pub type Nfts = pallet_nfts;
    }
    ```

3. Configure the pallet in `kitchensink-parachain/runtime/src/configs/mod.rs`:

    ```diff
    +    pub const ItemDeposit: Balance = 100 * MICRO_UNIT;
    +    pub const MetadataDepositBase: Balance = 10 * MICRO_UNIT;
    +    pub const AttributeDepositBase: Balance = 10 * MICRO_UNIT;
    +    pub const DepositPerByte: Balance = 1 * MICRO_UNIT;
    +    pub const MaxDeadlineDurationConst: BlockNumber = DAYS;
    +    pub const NftsApprovalsLimit: u32 = 20;
    +    pub const NftsItemAttributesApprovalsLimit: u32 = 10;
    ll_enabled();
    +}
    +
    +impl pallet_nfts::Config for Runtime {
    +    type RuntimeEvent = RuntimeEvent;
    +    type Currency = Balances;
    +    type CollectionId = u32;
    +    type ItemId = u32;
    +    type ForceOrigin = EnsureRoot<AccountId>;
    +    type CreateOrigin = AsEnsureOriginWithArg<EnsureSigned<AccountId>>;
    +    type CollectionDeposit = CollectionDeposit;
    +    type ItemDeposit = ItemDeposit;
    +    type MetadataDepositBase = MetadataDepositBase;
    +    type AttributeDepositBase = AttributeDepositBase;
    +    type DepositPerByte = DepositPerByte;
    +    type StringLimit = frame_support::traits::ConstU32<256>;
    +    type KeyLimit = frame_support::traits::ConstU32<64>;
    +    type ValueLimit = frame_support::traits::ConstU32<256>;
    +    type MaxTips = frame_support::traits::ConstU32<10>;
    +    type MaxAttributesPerCall = frame_support::traits::ConstU32<10>;
    +    type WeightInfo = pallet_nfts::weights::SubstrateWeight<Runtime>;
    +    type Locker = ();
    +    type ApprovalsLimit = NftsApprovalsLimit;
    +    type ItemAttributesApprovalsLimit = NftsItemAttributesApprovalsLimit;
    +    type MaxDeadlineDuration = MaxDeadlineDurationConst;
    +    type Features = FeaturesConst;
    +    type OffchainSignature = sp_runtime::MultiSignature;
    >::Signer;
    +    type BlockNumberProvider = System;
    +}
    +
    parameter_types! {
    );
    ;
    ```


4. Build the runtime:

   ```bash
   cd kitchensink-parachain
   cargo build --release
   ```

5. Create a chain spec:

    ```bash
    chain-spec-builder create -t development --relay-chain paseo --para-id 1000 \
      --runtime ./target/release/wbuild/parachain-template-runtime/parachain_template_runtime.compact.compressed.wasm \
      named-preset development
    ```

6. Start a node:

   ```bash
   polkadot-omni-node --chain ./chain_spec.json --dev --dev-block-time 1000
   ```


## Testing
- From this tutorial folder:
  ```bash
  npm ci || npm i
  npm run test
  ```
- The e2e test connects to `ws://127.0.0.1:9944` if available and asserts that `pallet-nfts` (or `nfts`) is present in metadata; otherwise it skips fast.