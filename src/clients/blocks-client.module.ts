import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BlocksClientService } from "./blocks-client-service";
import { HttpClient } from "./http-client";
import { BlockProcessor } from "./block-processor";

@Module({
    imports: [HttpModule,],
    providers: [HttpClient, BlocksClientService, BlockProcessor],
    exports: [BlocksClientService,],
})
export class BlocksClientModule {}
