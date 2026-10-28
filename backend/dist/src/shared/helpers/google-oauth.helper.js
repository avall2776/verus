"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleOAuthUrl = getGoogleOAuthUrl;
exports.exchangeCodeForTokens = exchangeCodeForTokens;
exports.getValidGoogleAccessToken = getValidGoogleAccessToken;
exports.isGoogleDriveConnected = isGoogleDriveConnected;
exports.uploadBufferToGoogleDrive = uploadBufferToGoogleDrive;
const fs = require("fs");
const path = require("path");
const axios_1 = require("axios");
const TOKENS_PATH = path.join(process.cwd(), 'credentials', 'google-oauth-tokens.json');
function getStoredTokens(tenantId = 'default') {
    try {
        if (!fs.existsSync(TOKENS_PATH))
            return null;
        const raw = fs.readFileSync(TOKENS_PATH, 'utf8');
        const all = JSON.parse(raw);
        return all[tenantId] || all['default'] || null;
    }
    catch {
        return null;
    }
}
function saveTokens(tenantId = 'default', tokens) {
    try {
        const dir = path.dirname(TOKENS_PATH);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        let all = {};
        if (fs.existsSync(TOKENS_PATH)) {
            all = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
        }
        all[tenantId] = {
            ...(all[tenantId] || {}),
            ...tokens,
            updated_at: new Date().toISOString()
        };
        all['default'] = all[tenantId];
        fs.writeFileSync(TOKENS_PATH, JSON.stringify(all, null, 2), 'utf8');
    }
    catch (err) {
        console.error('Falha ao salvar tokens do Google:', err.message);
    }
}
function getOAuthCredentials() {
    let clientId = process.env.GOOGLE_CLIENT_ID;
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    let redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://avalmarketing.com.br/vallor/settings';
    if (!clientId || !clientSecret) {
        try {
            const clientJsonPath = path.join(process.cwd(), 'credentials', 'google-oauth-client.json');
            if (fs.existsSync(clientJsonPath)) {
                const clientJson = JSON.parse(fs.readFileSync(clientJsonPath, 'utf8'));
                const web = clientJson.web || clientJson.installed || {};
                clientId = clientId || web.client_id;
                clientSecret = clientSecret || web.client_secret;
                if (web.redirect_uris && web.redirect_uris[0]) {
                    redirectUri = process.env.GOOGLE_REDIRECT_URI || web.redirect_uris[0];
                }
            }
        }
        catch {
        }
    }
    return { clientId: clientId || '', clientSecret: clientSecret || '', redirectUri };
}
function getGoogleOAuthUrl(tenantId) {
    const { clientId, redirectUri } = getOAuthCredentials();
    const scopes = [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ');
    return `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(tenantId)}`;
}
async function exchangeCodeForTokens(code, tenantId = 'default') {
    const { clientId, clientSecret, redirectUri } = getOAuthCredentials();
    try {
        const res = await axios_1.default.post('https://oauth2.googleapis.com/token', new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const data = res.data;
        const expiresAt = Date.now() + ((data.expires_in || 3600) * 1000) - 60000;
        let email = '';
        try {
            const userRes = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${data.access_token}` }
            });
            email = userRes.data?.email || '';
        }
        catch { }
        saveTokens(tenantId, {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: expiresAt,
            email
        });
        return { success: true, email };
    }
    catch (err) {
        const msg = err.response?.data?.error_description || err.response?.data?.error || err.message;
        console.error('Falha ao trocar código OAuth do Google:', msg);
        return { success: false, error: msg };
    }
}
async function getValidGoogleAccessToken(tenantId = 'default') {
    const tokens = getStoredTokens(tenantId);
    if (!tokens)
        return null;
    if (tokens.access_token && Date.now() < tokens.expires_at) {
        return tokens.access_token;
    }
    if (tokens.refresh_token) {
        const { clientId, clientSecret } = getOAuthCredentials();
        try {
            const res = await axios_1.default.post('https://oauth2.googleapis.com/token', new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: tokens.refresh_token,
                grant_type: 'refresh_token'
            }).toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const data = res.data;
            const expiresAt = Date.now() + ((data.expires_in || 3600) * 1000) - 60000;
            saveTokens(tenantId, {
                ...tokens,
                access_token: data.access_token,
                refresh_token: data.refresh_token || tokens.refresh_token,
                expires_at: expiresAt
            });
            return data.access_token;
        }
        catch (err) {
            console.error('Erro ao renovar token do Google:', err.response?.data || err.message);
            return null;
        }
    }
    return null;
}
function isGoogleDriveConnected(tenantId = 'default') {
    const tokens = getStoredTokens(tenantId);
    return {
        connected: Boolean(tokens && (tokens.access_token || tokens.refresh_token)),
        email: tokens?.email || undefined
    };
}
async function uploadBufferToGoogleDrive(fileBuffer, originalFilename, mimeType, parentFolderId = '1nHrHOq1s3D8Ckvl-gAcoeIAKGkopvnaG', tenantId = 'default') {
    const token = await getValidGoogleAccessToken(tenantId);
    if (!token) {
        throw new Error('Google Drive não conectado. Faça a conexão OAuth da conta primeiro.');
    }
    const metadata = {
        name: originalFilename,
        parents: [parentFolderId]
    };
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
    const multipartRequestBody = Buffer.concat([
        Buffer.from(delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            `Content-Type: ${mimeType}\r\n\r\n`),
        fileBuffer,
        Buffer.from(closeDelimiter)
    ]);
    const uploadRes = await axios_1.default.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', multipartRequestBody, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
        },
        maxBodyLength: 200 * 1024 * 1024,
        maxContentLength: 200 * 1024 * 1024
    });
    const fileData = uploadRes.data;
    try {
        await axios_1.default.post(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, { role: 'reader', type: 'anyone' }, { headers: { Authorization: `Bearer ${token}` } });
    }
    catch (err) {
        console.warn('Permissão pública opcional falhou:', err.message);
    }
    return {
        fileId: fileData.id,
        webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view?usp=sharing`,
        webContentLink: fileData.webContentLink || `https://drive.google.com/uc?id=${fileData.id}&export=download`,
        fileName: originalFilename
    };
}
//# sourceMappingURL=google-oauth.helper.js.map