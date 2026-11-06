"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const path = require("path");
const fs = require("fs");
const storage_service_1 = require("../../shared/storage/storage.service");
const google_drive_helper_1 = require("../../shared/helpers/google-drive.helper");
let MediaController = class MediaController {
    constructor(storageService) {
        this.storageService = storageService;
    }
    async uploadMedia(file, folder) {
        if (!file) {
            throw new common_1.BadRequestException('Arquivo obrigatório para upload.');
        }
        const result = await this.storageService.uploadFile({
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
        }, folder || 'chat');
        return {
            success: true,
            ...result,
        };
    }
    getFile(filename, res) {
        const filePath = this.storageService.getLocalFilePath(filename);
        if (!filePath || !fs.existsSync(filePath)) {
            throw new common_1.NotFoundException('Arquivo não encontrado no servidor.');
        }
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
            '.vcf': 'text/vcard; charset=utf-8',
            '.zip': 'application/zip',
            '.ogg': 'audio/ogg',
            '.opus': 'audio/ogg',
            '.webm': 'audio/webm',
            '.mp3': 'audio/mpeg',
            '.m4a': 'audio/mp4',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Content-Disposition', `inline; filename="${path.basename(filename)}"`);
        return res.sendFile(filePath);
    }
    getAudioFile(filename, res) {
        const safeFilename = path.basename(filename);
        const candidatePaths = [
            path.join(process.cwd(), 'uploads', 'audio', safeFilename),
            path.join(process.cwd(), 'uploads', 'media', safeFilename),
            path.join(process.cwd(), 'uploads', safeFilename),
        ];
        let filePath = candidatePaths.find(p => fs.existsSync(p));
        if (!filePath) {
            const alternativePath = this.storageService.getLocalFilePath(filename);
            if (alternativePath && fs.existsSync(alternativePath)) {
                filePath = alternativePath;
            }
        }
        if (!filePath) {
            throw new common_1.NotFoundException('Arquivo de áudio não encontrado.');
        }
        const ext = path.extname(safeFilename).toLowerCase();
        const mimeTypes = {
            '.ogg': 'audio/ogg',
            '.opus': 'audio/ogg',
            '.webm': 'audio/webm',
            '.mp3': 'audio/mpeg',
            '.m4a': 'audio/mp4',
            '.wav': 'audio/wav',
        };
        const contentType = mimeTypes[ext] || 'audio/ogg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        return res.sendFile(filePath);
    }
    async streamDriveFile(driveId, customName, req, res) {
        try {
            const fileData = await (0, google_drive_helper_1.downloadDriveFileBuffer)(driveId);
            if (fileData && fileData.buffer && fileData.buffer.length > 0) {
                const fileName = customName || 'video.mp4';
                let mimeType = fileData.mimeType;
                const lowerName = fileName.toLowerCase();
                if (!mimeType || mimeType === 'application/octet-stream') {
                    if (lowerName.endsWith('.mp4') || lowerName.endsWith('.mov') || lowerName.includes('video')) {
                        mimeType = 'video/mp4';
                    }
                    else if (lowerName.endsWith('.pdf')) {
                        mimeType = 'application/pdf';
                    }
                    else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
                        mimeType = 'image/jpeg';
                    }
                    else if (lowerName.endsWith('.png')) {
                        mimeType = 'image/png';
                    }
                    else if (lowerName.endsWith('.webp')) {
                        mimeType = 'image/webp';
                    }
                }
                const totalLength = fileData.buffer.length;
                const range = req.headers.range;
                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
                if (range) {
                    const parts = range.replace(/bytes=/, '').split('-');
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
                    const chunkSize = end - start + 1;
                    res.status(206);
                    res.setHeader('Content-Range', `bytes ${start}-${end}/${totalLength}`);
                    res.setHeader('Content-Length', chunkSize);
                    res.setHeader('Content-Type', mimeType);
                    return res.end(fileData.buffer.subarray(start, end + 1));
                }
                res.setHeader('Content-Type', mimeType);
                res.setHeader('Content-Length', totalLength);
                return res.end(fileData.buffer);
            }
        }
        catch (err) {
        }
        return res.redirect(302, `https://drive.google.com/file/d/${driveId}/view?usp=sharing`);
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "uploadMedia", null);
__decorate([
    (0, common_1.Get)('file/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "getFile", null);
__decorate([
    (0, common_1.Get)('audio/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "getAudioFile", null);
__decorate([
    (0, common_1.Get)('drive-stream/:driveId'),
    __param(0, (0, common_1.Param)('driveId')),
    __param(1, (0, common_1.Query)('name')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "streamDriveFile", null);
exports.MediaController = MediaController = __decorate([
    (0, common_1.Controller)('media'),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], MediaController);
//# sourceMappingURL=media.controller.js.map