import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { BlocksClientModule } from './clients/blocks-client.module';
import { BlocksClientService } from './clients/blocks-client-service';
import { BlockProcessor } from './clients/block-processor';
import * as JSONStream from 'JSONStream';
import { Block } from "./clients/types/api-responses";


async function bootstrap() {
    try {
        const app = await NestFactory.createApplicationContext(BlocksClientModule);

        const blocksClient = app.get(BlocksClientService);
        const blockProcessor = app.get(BlockProcessor);

        Logger.log('🚀 Starting blocks client...');

        await processBlocks(blocksClient, blockProcessor);

        await app.close();
        Logger.log('✅ Blocks client finished successfully');
        process.exit(0);

    } catch (error) {
        Logger.error('💥 Blocks client failed:', error);
        process.exit(1);
    }
}

async function processBlocks(
    blocksClient: BlocksClientService,
    blockProcessor: BlockProcessor
): Promise<void> {
    const startTime = Date.now();
    try {
        const latestHeight = await blocksClient.getLatestBlockHeight();
        const blockchainHeight = await blocksClient.getBlockchainInfo();

        Logger.log(`📊 Latest block height: ${latestHeight} and blockchainHeight: ${blockchainHeight}`);

        const fromHeight = 3078000;
        const toHeight = 3088000;

        const range = {
            fromHeight: fromHeight.toString(),
            toHeight: toHeight.toString(),
        };

        Logger.log(`🔄 Fetching blocks from ${fromHeight} to ${toHeight}`);

        const stream = await blocksClient.getBlocksStream(range);
        let processedBlocks = 0;

        await new Promise<void>((resolve, reject) => {
            const parser = JSONStream.parse('blocks.*');

            parser
                .on('data', (block: Block) => {
                    processedBlocks++;
                    blockProcessor.processBlock(block);
                })
                .on('end', () => {
                    const totalTime = (Date.now() - startTime) / 1000;
                    Logger.log(`✅ Processed ${processedBlocks} blocks in ${totalTime}s`);
                    resolve();
                })
                .on('error', (error: Error) => {
                    Logger.error('❌ JSON parsing error:', error);
                    reject(error);
                });

            stream.pipe(parser);
        });

    } catch (error) {
        Logger.error('Failed to process blocks:', error);
        throw error;
    }
}

bootstrap();
