import { SeedToMnemonicResult, validateAccount } from '@zano-project/zano-utils-js';
import {
    AccountKeys,
    getAccountBySecretSpendKey,
    getMasterAddress,
    mnemonicToSeed,
    MnemonicToSeedResult,
    seedToMnemonic,
} from '@zano-project/zano-utils-js';

import { getRandomBytes } from "@zano-project/zano-utils-js/dist/core/crypto";
import {
    CreateWalletResult,
    DecodedTransactionInfo,
    TransactionInfo,
    TxOutZarcanum,
} from "./types";
import basex from 'base-x'
import base from "base-x";
import BaseConverter = base.BaseConverter;


const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const bs64: BaseConverter = basex(BASE64)

class ZanoWallet {
    // private _initHeight: string | null = null;
    private _lastProceededHeight: string | null = null;
    private _secretViewKey: string | null = null;
    private _publicSpendKey: string | null = null;
    private _isOpen: boolean = false;
    private _outputsMap: Map<string, number> = new Map();
    private _balance: number = 0;


    // async init(transactions: TransactionInfo[]): Promise<void> {
    //     if (!this._isOpen) throw new Error('Wallet not open');
    //
    //     for (const transaction of transactions) {
    //         await this.processTransaction(transaction)
    //     }
    // }

    async create(): Promise<CreateWalletResult> {
        const seedPhrase: SeedToMnemonicResult = seedToMnemonic(getRandomBytes(64).toString('hex'));

        const secretSpendKey: MnemonicToSeedResult  = mnemonicToSeed(seedPhrase);
        if (secretSpendKey === false) throw new Error('Failed to generate from mnemonic');

        const accountKeys: AccountKeys = getAccountBySecretSpendKey(secretSpendKey);
        const masterAddress: string = getMasterAddress(
            accountKeys.publicSpendKey,
            accountKeys.publicViewKey,
        );

        return {
            seedPhrase,
            secretSpendKey,
            secretViewKey: accountKeys.secretViewKey,
            publicSpendKey: accountKeys.publicSpendKey,
            publicViewKey: accountKeys.publicViewKey,
            address: masterAddress,
        }
    }

    async open(params: CreateWalletResult): Promise<void> {
        const validatedAccount: boolean = validateAccount(
            params.address,
            params.publicSpendKey,
            params.publicViewKey,
            params.secretSpendKey,
            params.secretViewKey,
        );

        if (!validatedAccount) throw new Error('Validation failed');

        this._secretViewKey = params.secretViewKey;
        this._publicSpendKey = params.publicSpendKey;
        this._isOpen = true;

    }

    async load(transactions: TransactionInfo[]): Promise<any> {
        if (!this._isOpen) throw new Error('Wallet not open');

        for (const transaction of transactions) {
            await this.processTransaction(transaction)
        }

        return { balance: this._balance }
    }

    async processTransaction(tx: TransactionInfo) {
        const decodedTx: DecodedTransactionInfo = JSON.parse(Buffer.from(bs64.decode(tx.object_in_json)).toString('utf8'));
        let balanceChange = 0;

        for (const vout of decodedTx.AGGREGATED.vout) {
            const output: TxOutZarcanum = vout.tx_out_zarcanum;

            if (this.isOutputMine(output)) {
                const amount = this.decodeAmount(this._secretViewKey, output.encrypted_amount);
                const keyImage = this.getKeyImage(this._secretViewKey, output);

                this._outputsMap.set(keyImage, amount);
                balanceChange += amount;
            }
        }

        if (decodedTx.AGGREGATED.vin.length > 1) {
            const vin = decodedTx.AGGREGATED.vin[1]
            if (vin?.txin_zc_input?.k_image) {
                const kImage = vin.txin_zc_input.k_image;

                if (this._outputsMap.has(kImage)) {
                    const spentAmount = this._outputsMap.get(kImage);
                    balanceChange -= spentAmount;

                    this._outputsMap.delete(kImage);
                }
            }
        }

        if (balanceChange !== 0) {
            this._balance += balanceChange;
        }
    }

    private isOutputMine(output: TxOutZarcanum): boolean {
        return (
            output.stealth_address === this.stealthAddress(this._secretViewKey) &&
            output.concealing_point === this.getConcealingPoint(this._secretViewKey) &&
            output.blinded_asset_id === this.getNativeBlindedAsset(this._secretViewKey)
        );
    }


    // заглушки функций библиотеки
    stealthAddress(data: string): string {
        return ''
    }
    getConcealingPoint(data: string): string {
        return ''
    }
    getNativeBlindedAsset(data: string): string {
        return ''
    }
    decodeAmount(key: string, amount: bigint): number {
        return 1
    }
    getKeyImage(key: string, out: TxOutZarcanum): string {
        return ''
    }
}
