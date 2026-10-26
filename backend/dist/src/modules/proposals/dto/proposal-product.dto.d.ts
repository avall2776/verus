export declare class CreateProposalProductDto {
    name: string;
    description?: string;
    price?: number;
    driveUrl?: string;
    driveId?: string;
    folderName?: string;
    unit?: string;
    isActive?: boolean;
}
export declare class UpdateProposalProductDto {
    name?: string;
    description?: string;
    price?: number;
    driveUrl?: string;
    driveId?: string;
    folderName?: string;
    unit?: string;
    isActive?: boolean;
}
export declare class UpdateDriveConfigDto {
    driveFolder?: string;
}
