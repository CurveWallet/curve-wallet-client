import { SeedToMnemonicResult } from "@zano-project/zano-utils-js";

export interface CreateWalletResult {
    seedPhrase: SeedToMnemonicResult;
    secretSpendKey: string;
    secretViewKey: string,
    publicSpendKey: string,
    publicViewKey: string,
    address: string,
}

export type TransactionsDetails = {
    ins: In[];
    outs: Out[]
}

export type In = {
    amount: number;
    global_indexes: number[]
}

export type Out = {
    amount: number;
    global_index: number;
    pub_keys: string[]
}

export type TransactionInfo = {
    id: string;
    object_in_json: string;
};

export type DecodedTransactionInfo = {
    AGGREGATED: Aggregated;
}

type Aggregated = {
    vin: Vin[];
    vout: Vout[];
}

type Vin = {
    txin_zc_input?: KeyImage
}

type KeyImage = {
    k_image: string;
}

type Vout = {
    tx_out_zarcanum: TxOutZarcanum;
}

export type TxOutZarcanum = {
    stealth_address: string;
    concealing_point: string;
    blinded_asset_id: string;
    encrypted_amount: bigint;
}
