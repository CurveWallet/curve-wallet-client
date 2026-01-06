import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { BlocksClientModule } from './client/blocks-client.module';
import {AuthClientService} from "./client/auth-client.service";
import {AuthClientModule} from "./client/auth-client.module";

async function bootstrap() {
    try {
        const app = await NestFactory.createApplicationContext(AuthClientModule);

        Logger.log('🚀 Starting client...');

        const authClient = app.get(AuthClientService);
        await  authClient.registerDevice('1234')

        await app.close();
        process.exit(0);

    } catch (error) {
        Logger.error('💥 Client failed:', error);
        process.exit(1);
    }
}

bootstrap();
