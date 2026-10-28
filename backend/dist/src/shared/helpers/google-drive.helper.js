"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGoogleDriveId = extractGoogleDriveId;
exports.isGoogleDriveUrl = isGoogleDriveUrl;
exports.detectMediaType = detectMediaType;
exports.getMimeType = getMimeType;
exports.downloadDriveFileBuffer = downloadDriveFileBuffer;
const axios_1 = require("axios");
const google_oauth_helper_1 = require("./google-oauth.helper");
function extractGoogleDriveId(urlOrId) {
    if (!urlOrId)
        return null;
    const trimmed = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
        return trimmed;
    }
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /\/folders\/([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/,
    ];
    for (const regex of patterns) {
        const match = trimmed.match(regex);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}
function isGoogleDriveUrl(url) {
    if (!url)
        return false;
    return (url.includes('drive.google.com') ||
        url.includes('docs.google.com') ||
        url.includes('googleusercontent.com'));
}
function detectMediaType(filenameOrUrl, explicitType) {
    if (explicitType === 'image' || explicitType === 'video' || explicitType === 'document') {
        return explicitType;
    }
    const str = (filenameOrUrl || '').toLowerCase();
    if (str.endsWith('.mp4') ||
        str.endsWith('.mov') ||
        str.endsWith('.mkv') ||
        str.endsWith('.webm') ||
        str.endsWith('.avi') ||
        str.includes('video')) {
        return 'video';
    }
    if (str.endsWith('.png') ||
        str.endsWith('.jpg') ||
        str.endsWith('.jpeg') ||
        str.endsWith('.webp') ||
        str.endsWith('.gif') ||
        str.endsWith('.svg')) {
        return 'image';
    }
    return 'document';
}
function getMimeType(filenameOrExt, fallbackType = 'document') {
    const lower = filenameOrExt.toLowerCase();
    if (lower.endsWith('.pdf'))
        return 'application/pdf';
    if (lower.endsWith('.png'))
        return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
        return 'image/jpeg';
    if (lower.endsWith('.webp'))
        return 'image/webp';
    if (lower.endsWith('.gif'))
        return 'image/gif';
    if (lower.endsWith('.mp4'))
        return 'video/mp4';
    if (lower.endsWith('.mov'))
        return 'video/quicktime';
    if (lower.endsWith('.docx'))
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (lower.endsWith('.xlsx'))
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (fallbackType === 'image')
        return 'image/jpeg';
    if (fallbackType === 'video')
        return 'video/mp4';
    return 'application/pdf';
}
async function downloadDriveFileBuffer(driveFileId, apiKey) {
    const effectiveKey = apiKey || process.env.GOOGLE_DRIVE_API_KEY;
    try {
        const oauthToken = await (0, google_oauth_helper_1.getValidGoogleAccessToken)();
        if (oauthToken) {
            const apiUrl = `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`;
            const res = await axios_1.default.get(apiUrl, {
                headers: { Authorization: `Bearer ${oauthToken}` },
                responseType: 'arraybuffer',
                timeout: 25000,
            });
            const mimeType = res.headers['content-type'] || 'application/octet-stream';
            return {
                buffer: Buffer.from(res.data),
                mimeType,
            };
        }
    }
    catch (oauthErr) {
    }
    if (effectiveKey) {
        try {
            const apiUrl = `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media&key=${effectiveKey}`;
            const res = await axios_1.default.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 25000,
            });
            const mimeType = res.headers['content-type'] || 'application/octet-stream';
            return {
                buffer: Buffer.from(res.data),
                mimeType,
            };
        }
        catch (apiErr) {
            console.warn(`[DRIVE_HELPER] Falha ao baixar via Google Drive API Key (${apiErr.message}). Tentando fallback UC...`);
        }
    }
    try {
        const ucUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}&confirm=t`;
        const res = await axios_1.default.get(ucUrl, {
            responseType: 'arraybuffer',
            timeout: 25000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });
        const contentType = res.headers['content-type'] || '';
        if (!contentType.includes('text/html')) {
            return {
                buffer: Buffer.from(res.data),
                mimeType: contentType || 'application/octet-stream',
            };
        }
    }
    catch (ucErr) {
        console.warn(`[DRIVE_HELPER] Falha no fallback UC: ${ucErr.message}`);
    }
    try {
        const lh3Url = `https://lh3.googleusercontent.com/d/${driveFileId}`;
        const res = await axios_1.default.get(lh3Url, {
            responseType: 'arraybuffer',
            timeout: 15000,
        });
        const contentType = res.headers['content-type'] || '';
        if (contentType.startsWith('image/')) {
            return {
                buffer: Buffer.from(res.data),
                mimeType: contentType,
            };
        }
    }
    catch {
    }
    return null;
}
//# sourceMappingURL=google-drive.helper.js.map