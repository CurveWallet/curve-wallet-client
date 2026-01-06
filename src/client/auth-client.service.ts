import {Injectable, Logger} from "@nestjs/common";
import {HttpClient} from "./http-client";
import {createSignature, verifySignature} from '@badvoice/cryptonote-simple-signature';
import {hmac} from '@noble/hashes/hmac';
import {sha256} from '@noble/hashes/sha2';
import {randomBytes} from '@noble/hashes/utils';
import * as ZanoUtils from '@zano-project/zano-utils-js';

export interface RegisterDeviceParams {
    walletId: string;
    deviceId: string;
    pinHash: string;
}

export interface RegisterDeviceResponse {
    deviceToken: string;
    walletToken: string;
}

@Injectable()
export class AuthClientService {
    private readonly logger = new Logger(AuthClientService.name);

    constructor(private readonly httpClient: HttpClient) {}

    async registerDevice(pin: string): Promise<RegisterDeviceResponse> {
        const secretSpendKey = '80b3e96a3eb765332b0fd3e44e0fefa58747a70025bf91aa4a7b758ab6f5590d';
        const deviceKeyPair: ZanoUtils.AccountKeys = ZanoUtils.generateAccountKeys();
        const body: RegisterDeviceParams = this.buildBody(pin, deviceKeyPair);

        const signature = this.generateSignature(body, deviceKeyPair.secretSpendKey);
        this.logger.debug(`signature: ${signature}, body: ${JSON.stringify(body)}`);

        try {
            const response = await this.httpClient.post<RegisterDeviceResponse>(
                'http://localhost:3334/api/v1/auth/register',
                body,
                {
                    headers: {
                        'Signature': signature,
                        'Date': new Date().toUTCString(),
                        'Host': 'localhost:3334',
                        'Content-Type': 'application/json',
                    }
                }
            );

            console.log(response);
            return response;
        } catch (error) {
            this.logger.error('Registration failed:', error);
            throw error;
        }
    }

    private buildBody(pin: string, deviceKeyPair: ZanoUtils.AccountKeys): RegisterDeviceParams {
        // const deviceKeyPair: ZanoUtils.AccountKeys = ZanoUtils.generateAccountKeys();

        return {
            walletId: ZanoUtils.privateKeyToPublicKey(deviceKeyPair.secretSpendKey),
            deviceId: deviceKeyPair.publicSpendKey,
            pinHash: Buffer.from(hmac(sha256, randomBytes(32), pin)).toString('hex'),
        }
    }

    private generateSignature(body: RegisterDeviceParams, secretSpendKey: string): string {
        const bodyString: string = JSON.stringify(body);
        const bodyHash: string = Buffer.from(sha256(bodyString)).toString('hex');

        const method = 'post';
        const host = 'localhost:3334';
        const url = `http://${host}/api/v1/auth/register`;
        const date = new Date().toUTCString();

        const messageString = [method, url, date, bodyHash];
        const normalizedMessage = Buffer.from(messageString.join(' '), 'utf-8').toString('hex');
        this.logger.debug(`normalizedMessage: ${normalizedMessage}`);

        const verif = verifySignature(normalizedMessage, body.deviceId, createSignature(normalizedMessage, secretSpendKey));
        this.logger.debug(`verifySignature: ${verif}`);

        return createSignature(normalizedMessage, secretSpendKey);
    }
}
