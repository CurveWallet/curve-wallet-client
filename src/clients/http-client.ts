import { AxiosInstance, AxiosResponse } from 'axios';
import {
    HttpException,
    HttpStatus,
    Injectable,
    Logger
} from "@nestjs/common";

import { HttpService } from '@nestjs/axios';


@Injectable()
export class HttpClient {
    private readonly httpClient: AxiosInstance;
    private readonly logger = new Logger(HttpClient.name);

    constructor(private readonly httpService: HttpService) {
        this.httpClient = this.httpService.axiosRef;
    }

    async get<T>(url: string, params?: any): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.httpClient.get(url, { params });

            if (response.data && (response.data as any).status === 'BUSY') {
                throw new HttpException(
                    'Server is too busy, please try again later.',
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }

            return response.data;
        } catch (error) {
            this.logger.error(`HTTP GET failed for ${url}: ${error.message}`);

            if (error.response?.status === 404) {
                throw new HttpException('Resource not found', HttpStatus.NOT_FOUND);
            }

            throw new HttpException(
                'HTTP request failed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getStream(url: string, params?: any): Promise<NodeJS.ReadableStream> {
        try {
            const response = await this.httpClient.get(url, {
                params,
                responseType: 'stream'
            });

            return response.data;
        } catch (error) {
            this.logger.error(`Stream request failed for ${url}: ${error.message}`);
            throw new HttpException(
                'Stream request failed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
