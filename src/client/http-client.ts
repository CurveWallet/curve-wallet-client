import {AxiosError, AxiosInstance, AxiosResponse} from 'axios';
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

    async post<T>(url: string, data?: any, config?: {
        headers?: Record<string, string>;
        params?: any;
        timeout?: number;
    }): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.httpClient.post(url, data, config);

            if (response.data && (response.data as any).status === 'BUSY') { // this.validateResponse(response);
                throw new HttpException(
                    'Server is too busy, please try again later.',
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }

            return response.data;
        } catch (error) {
            this.logger.error(`HTTP POST failed for ${url}:`, error.message);

            if (error instanceof HttpException) {
                throw error;
            }

            const axiosError = error as AxiosError;

            if (axiosError.response) {
                const status = axiosError.response.status;
                const data = axiosError.response.data as any;

                switch (status) {
                    case HttpStatus.BAD_REQUEST:
                        throw new HttpException(
                            data?.message || 'Bad request',
                            HttpStatus.BAD_REQUEST,
                        );
                    case HttpStatus.TOO_MANY_REQUESTS:
                        throw new HttpException(
                            data?.message || 'Too many requests',
                            HttpStatus.TOO_MANY_REQUESTS,
                        );
                    default:
                        throw new HttpException(
                            data?.message || `HTTP error ${status}`,
                            status,
                        );
                }
            } else if (axiosError.request) {
                throw new HttpException(
                    'No response from server',
                    HttpStatus.GATEWAY_TIMEOUT,
                );
            } else {
                throw new HttpException(
                    'Request configuration error',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
        }
    }


    // async getStream(url: string, params?: any): Promise<NodeJS.ReadableStream> {
    //     try {
    //         const response = await this.httpClient.get(url, {
    //             params,
    //             responseType: 'stream'
    //         });
    //
    //         return response.data;
    //     } catch (error) {
    //         this.logger.error(`Stream request failed for ${url}: ${error.message}`);
    //         throw new HttpException(
    //             'Stream request failed',
    //             HttpStatus.INTERNAL_SERVER_ERROR
    //         );
    //     }
    // }
}
