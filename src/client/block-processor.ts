import { Block, Transaction } from "./types/api-responses";

export class BlockProcessor {
    processBlock(block: Block): void {
        console.log(`🔄 Processing block ${block.height} with ${block.txs.length} transactions`);

        block.txs.forEach((tx: Transaction) => {
            this.processTransaction(tx);
        });
    }

    private processTransaction(tx: Transaction): void {
        console.log(`  📝 Processing transaction: ${tx.id}, ${tx.object_in_json}`);
    }
}
