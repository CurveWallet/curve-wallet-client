export interface HeightResponse {
    height: number;
}

export interface BlockchainInfoResponse {
    lastProcessedBlock: number;
}

export interface GetBlocksDto {
    fromHeight: string;
    toHeight: string;
}

export interface Block {
    height: number;
    txs: Transaction[];
}

export interface Transaction {
    id: string;
    object_in_json: string;
}
