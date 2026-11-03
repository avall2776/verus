import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { getValidGoogleAccessToken } from '../../shared/helpers/google-oauth.helper';

export interface SyncContactPayload {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

@Injectable()
export class GoogleContactsService {
  private readonly logger = new Logger(GoogleContactsService.name);

  /**
   * Sanitiza e valida o número de telefone.
   * Descarta @lids, grupos de WhatsApp (12036...) e números com menos de 10 dígitos.
   */
  public sanitizePhone(rawPhone?: string | null): string | null {
    if (!rawPhone) return null;
    if (rawPhone.includes('@lid') || rawPhone.includes('@g.us')) return null;

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

  /**
   * Limpa e padroniza o nome de exibição do cliente.
   */
  public formatDisplayName(rawName: string, phone: string): string {
    let name = (rawName || '').trim();
    const phoneDigits = phone.replace(/\D/g, '');
    const nameDigits = name.replace(/\D/g, '');

    if (!name || name === phone || nameDigits === phoneDigits) {
      name = `Cliente ${phone.slice(-4)}`;
    }
    // Remove quebras e pontuações perigosas
    name = name.replace(/[\r\n;]/g, ' ').trim();
    return `[Verto] ${name}`;
  }

  /**
   * Sincroniza um contato individual com a agenda do Google Contatos.
   * Aplica lógica de busca prévia para evitar qualquer duplicidade na agenda.
   */
  async syncContact(tenantId: string, contact: SyncContactPayload): Promise<{ success: boolean; message?: string }> {
    const formattedPhone = this.sanitizePhone(contact.phone);
    if (!formattedPhone) {
      // Contato sem telefone válido ou ainda em @lid provisório: ignorar silenciosamente
      return { success: false, message: 'Telefone inválido ou não elegível para agenda.' };
    }

    const token = await getValidGoogleAccessToken(tenantId);
    if (!token) {
      // Conta Google ainda não conectada para este tenant
      return { success: false, message: 'Google Contatos não conectado para este tenant.' };
    }

    const displayName = this.formatDisplayName(contact.name, formattedPhone);

    try {
      // 1. Busca prévia no Google Contatos por este número de telefone (Anti-duplicação)
      const searchRes = await axios.get('https://people.googleapis.com/v1/people:searchContacts', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          query: formattedPhone,
          readMask: 'names,phoneNumbers,metadata',
        },
      }).catch(() => null);

      const existingPerson = searchRes?.data?.results?.[0]?.person;

      if (existingPerson && existingPerson.resourceName) {
        // Contato JÁ EXISTE no Google! Faz Update (Patch) para atualizar nome/telefone
        const resourceName = existingPerson.resourceName;
        const etag = existingPerson.etag;

        await axios.patch(`https://people.googleapis.com/v1/${resourceName}:updateContact`, {
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

      // 2. Não existe ainda: Cria um novo contato no Google Contatos
      await axios.post('https://people.googleapis.com/v1/people:createContact', {
        names: [{ givenName: displayName }],
        phoneNumbers: [{ value: formattedPhone, type: 'mobile' }],
        ...(contact.email ? { emailAddresses: [{ value: contact.email.trim(), type: 'work' }] } : {}),
        organizations: [{ name: 'Verto Soluções Agrícolas', title: 'Cliente' }],
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.logger.log(`Novo contato sincronizado com Google Contatos: ${displayName} (${formattedPhone})`);
      return { success: true, message: 'Contato salvo com sucesso na agenda do Google.' };
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || err.message;
      this.logger.warn(`Falha ao sincronizar contato com Google: ${errMsg}`);
      return { success: false, message: errMsg };
    }
  }
}
