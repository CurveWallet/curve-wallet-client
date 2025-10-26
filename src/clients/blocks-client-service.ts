import {Injectable, Logger} from "@nestjs/common";
import { HttpClient } from "./http-client";
import {
    BlockchainInfoResponse,
    GetBlocksDto,
    HeightResponse,
} from "./types/api-responses";

const baseUrl = 'http://localhost:3334/api/v1'


@Injectable()
export class BlocksClientService {
    private readonly logger = new Logger(BlocksClientService.name);

    constructor(
        private readonly httpClient: HttpClient,
    ) {}

    async getBlocksStream(range: GetBlocksDto): Promise<NodeJS.ReadableStream> {
        const { fromHeight, toHeight } = range;

        try {
            return this.httpClient.getStream(`${baseUrl}/blocks/range?fromHeight=${fromHeight}&toHeight=${toHeight}`);
        } catch (error) {
            console.error(error.message);
        }
    }

    async getLatestBlockHeight(): Promise<number> {
        try {
            const response = await this.httpClient.get<HeightResponse>(`${baseUrl}/blocks/height`);
            return response.height;
        } catch (error) {
            this.logger.error('❌ Failed to get block height:', error.message);
            throw error;
        }
    }

    async getBlockchainInfo(): Promise<number> {
        try {
            const response = await this.httpClient.get<BlockchainInfoResponse>(`${baseUrl}/blocks/info`);
            return response.lastProcessedBlock;
        } catch (error) {
            this.logger.error('❌ Failed to get block height:', error.message);
            throw error;
        }
    }
}
