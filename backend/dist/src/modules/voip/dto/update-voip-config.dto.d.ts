export declare class UpdateVoipConfigDto {
    providerName: string;
    sipHost: string;
    sipPort?: number;
    sipUsername?: string;
    sipPassword?: string;
    webrtcWssUrl?: string;
    directCallToken?: string;
    stunServer?: string;
    turnServer?: string;
    autoRecord?: boolean;
    enabled?: boolean;
}
