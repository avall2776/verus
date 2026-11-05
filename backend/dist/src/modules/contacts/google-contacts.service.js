"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GoogleContactsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleContactsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const google_oauth_helper_1 = require("../../shared/helpers/google-oauth.helper");
let GoogleContactsService = GoogleContactsService_1 = class GoogleContactsService {
    constructor() {
        this.logger = new common_1.Logger(GoogleContactsService_1.name);
    }
    sanitizePhone(rawPhone) {
        if (!rawPhone)
            return null;
        if (rawPhone.includes('@lid') || rawPhone.includes('@g.us'))
            return null;
        const digits = rawPhone.replace(/\D/g, '');
        if (digits.startsWith('12036') || digits.length > 15 || digits.length < 10) {
            return null;
        }
        if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
            return `+${digits}`;
        }
        if (digits.length === 10 || digits.length === 11) {
            return `+55${digits}`;
        }
        return `+${digits}`;
    }
    formatDisplayName(rawName, phone) {
        let name = (rawName || '').trim();
        const phoneDigits = phone.replace(/\D/g, '');
        const nameDigits = name.replace(/\D/g, '');
        if (!name || name === phone || nameDigits === phoneDigits) {
            name = `Cliente ${phone.slice(-4)}`;
        }
        name = name.replace(/[\r\n;]/g, ' ').trim();
        return `[Verto] ${name}`;
    }
    async syncContact(tenantId, contact) {
        const formattedPhone = this.sanitizePhone(contact.phone);
        if (!formattedPhone) {
            return { success: false, message: 'Telefone inválido ou não elegível para agenda.' };
        }
        const token = await (0, google_oauth_helper_1.getValidGoogleAccessToken)(tenantId);
        if (!token) {
            return { success: false, message: 'Google Contatos não conectado para este tenant.' };
        }
        const displayName = this.formatDisplayName(contact.name, formattedPhone);
        try {
            const searchRes = await axios_1.default.get('https://people.googleapis.com/v1/people:searchContacts', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    query: formattedPhone,
                    readMask: 'names,phoneNumbers,metadata',
                },
            }).catch(() => null);
            const existingPerson = searchRes?.data?.results?.[0]?.person;
            if (existingPerson && existingPerson.resourceName) {
                const resourceName = existingPerson.resourceName;
                const etag = existingPerson.etag;
                await axios_1.default.patch(`https://people.googleapis.com/v1/${resourceName}:updateContact`, {
                    etag,
                    names: [{ givenName: displayName }],
                    phoneNumbers: [{ value: formattedPhone, type: 'mobile' }],
                    ...(contact.email ? { emailAddresses: [{ value: contact.email.trim(), type: 'work' }] } : {}),
                    organizations: [{ name: 'Verto Soluções Agrícolas', title: 'Cliente' }],
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { updatePersonFields: 'names,phoneNumbers,emailAddresses,organizations' },
                });
                this.logger.log(`Contato existente atualizado no Google Contatos: ${displayName} (${formattedPhone})`);
                return { success: true, message: 'Contato atualizado na agenda do Google.' };
            }
            await axios_1.default.post('https://people.googleapis.com/v1/people:createContact', {
                names: [{ givenName: displayName }],
                phoneNumbers: [{ value: formattedPhone, type: 'mobile' }],
                ...(contact.email ? { emailAddresses: [{ value: contact.email.trim(), type: 'work' }] } : {}),
                organizations: [{ name: 'Verto Soluções Agrícolas', title: 'Cliente' }],
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            this.logger.log(`Novo contato sincronizado com Google Contatos: ${displayName} (${formattedPhone})`);
            return { success: true, message: 'Contato salvo com sucesso na agenda do Google.' };
        }
        catch (err) {
            const errMsg = err.response?.data?.error?.message || err.message;
            this.logger.warn(`Falha ao sincronizar contato com Google: ${errMsg}`);
            return { success: false, message: errMsg };
        }
    }
};
exports.GoogleContactsService = GoogleContactsService;
exports.GoogleContactsService = GoogleContactsService = GoogleContactsService_1 = __decorate([
    (0, common_1.Injectable)()
], GoogleContactsService);
//# sourceMappingURL=google-contacts.service.js.map