import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpClient } from "./http-client";
import {AuthClientService} from "./auth-client.service";

@Module({
    imports: [HttpModule],
    providers: [HttpClient, AuthClientService],
    exports: [AuthClientService,],
})
export class AuthClientModule {}
