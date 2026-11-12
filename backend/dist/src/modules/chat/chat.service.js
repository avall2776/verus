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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const path = require("path");
const fs = require("fs");
const os = require("os");
const child_process_1 = require("child_process");
const util_1 = require("util");
const prisma_service_1 = require("../../shared/database/prisma.service");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const axios_1 = require("axios");
const messaging_service_1 = require("../messaging/messaging.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const ai_service_1 = require("../ai/ai.service");
const chat_gateway_1 = require("./chat.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let ChatService = ChatService_1 = class ChatService {
    constructor(prisma, messagingService, whatsappService, aiService, chatGateway, scheduledQueue, notificationsService) {
        this.prisma = prisma;
        this.messagingService = messagingService;
        this.whatsappService = whatsappService;
        this.aiService = aiService;
        this.chatGateway = chatGateway;
        this.scheduledQueue = scheduledQueue;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(ChatService_1.name);
        this.productivityCache = new Map();
        this.conversationsCache = new Map();
    }
    async getConversationCounts(tenantId, userId, userRole, departmentId) {
        const isMaster = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        const where = { tenantId };
        if (!isMaster) {
            const userDepts = await this.prisma.userDepartment.findMany({
                where: { userId },
                select: { departmentId: true },
            });
            const allowedDeptIds = userDepts.map(ud => ud.departmentId);
            if (departmentId && departmentId !== 'all') {
                if (allowedDeptIds.includes(departmentId)) {
                    where.departmentId = departmentId;
                }
                else {
                    where.departmentId = { in: allowedDeptIds.length > 0 ? allowedDeptIds : ['__NONE__'] };
                }
            }
            else {
                where.departmentId = { in: allowedDeptIds.length > 0 ? allowedDeptIds : ['__NONE__'] };
            }
        }
        else {
            if (departmentId && departmentId !== 'all') {
                where.departmentId = departmentId;
            }
        }
        const groups = await this.prisma.conversation.groupBy({
            by: ['status', 'assignedTo'],
            where,
            _count: { id: true },
        });
        let waiting = 0;
        let mine = 0;
        let resolved = 0;
        for (const g of groups) {
            const count = g._count.id;
            const status = (g.status || '').toLowerCase();
            if ((status === 'waiting' || status === 'bot_active') && !g.assignedTo) {
                waiting += count;
            }
            if (['open', 'human_takeover', 'in_progress'].includes(status)) {
                if (isMaster || g.assignedTo === userId) {
                    mine += count;
                }
            }
            if (['resolved', 'closed'].includes(status)) {
                if (isMaster || g.assignedTo === userId) {
                    resolved += count;
                }
            }
        }
        return { waiting, mine, resolved, total: waiting + mine + resolved };
    }
    async getOperatorProductivity(tenantId, userId) {
        const cacheKey = `${tenantId}:${userId}`;
        const cached = this.productivityCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [todayResolved, pastResolvedCount, userGoal] = await Promise.all([
            this.prisma.conversation.findMany({
                where: {
                    tenantId,
                    assignedTo: userId,
                    status: { in: ['resolved', 'closed', 'RESOLVED', 'CLOSED'] },
                    updatedAt: { gte: startOfToday, lte: endOfToday },
                },
                include: {
                    messages: {
                        select: {
                            createdAt: true,
                            direction: true,
                            isInternal: true,
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            }),
            this.prisma.conversation.count({
                where: {
                    tenantId,
                    assignedTo: userId,
                    status: { in: ['resolved', 'closed', 'RESOLVED', 'CLOSED'] },
                    updatedAt: { gte: thirtyDaysAgo, lt: startOfToday },
                },
            }),
            this.prisma.goal.findFirst({
                where: {
                    tenantId,
                    userId,
                },
            }),
        ]);
        const todayFinishedCount = todayResolved.length;
        let tmaSeconds = 0;
        let firstResponseSeconds = 0;
        if (todayFinishedCount > 0) {
            let totalDurationSeconds = 0;
            let totalFirstRespSeconds = 0;
            let firstRespCount = 0;
            for (const conv of todayResolved) {
                const durationSec = Math.max(0, Math.round((new Date(conv.updatedAt).getTime() - new Date(conv.createdAt).getTime()) / 1000));
                totalDurationSeconds += durationSec;
                const inMsgs = conv.messages.filter(m => m.direction === 'INBOUND' && !m.isInternal);
                const outMsgs = conv.messages.filter(m => m.direction === 'OUTBOUND' && !m.isInternal);
                if (inMsgs.length > 0 && outMsgs.length > 0) {
                    const firstIn = inMsgs[0];
                    const firstOutAfterIn = outMsgs.find(o => new Date(o.createdAt).getTime() >= new Date(firstIn.createdAt).getTime()) || outMsgs[0];
                    const respSec = Math.max(0, Math.round((new Date(firstOutAfterIn.createdAt).getTime() - new Date(firstIn.createdAt).getTime()) / 1000));
                    totalFirstRespSeconds += respSec;
                    firstRespCount++;
                }
                else if (outMsgs.length > 0) {
                    const respSec = Math.max(0, Math.round((new Date(outMsgs[0].createdAt).getTime() - new Date(conv.createdAt).getTime()) / 1000));
                    totalFirstRespSeconds += respSec;
                    firstRespCount++;
                }
            }
            tmaSeconds = Math.round(totalDurationSeconds / todayFinishedCount);
            firstResponseSeconds = firstRespCount > 0 ? Math.round(totalFirstRespSeconds / firstRespCount) : 0;
        }
        const avgDaily = Math.round(pastResolvedCount / 30);
        let finishedVsAveragePercent = 0;
        if (avgDaily > 0) {
            finishedVsAveragePercent = Math.round(((todayFinishedCount - avgDaily) / avgDaily) * 100);
        }
        const dailyGoal = userGoal?.targetValue ? Math.round(Number(userGoal.targetValue)) : 10;
        const formatDuration = (sec) => {
            if (sec <= 0)
                return '0s';
            if (sec < 60)
                return `${sec}s`;
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            if (m < 60) {
                return s > 0 ? `${m}m ${s}s` : `${m}m`;
            }
            const h = Math.floor(sec / 3600);
            const remM = Math.floor((sec % 3600) / 60);
            return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
        };
        const result = {
            todayFinishedCount,
            tmaSeconds,
            firstResponseSeconds,
            todayAvgTma: todayFinishedCount > 0 && tmaSeconds > 0 ? formatDuration(tmaSeconds) : '0 min',
            todayFirstResp: todayFinishedCount > 0 && firstResponseSeconds > 0 ? formatDuration(firstResponseSeconds) : '0s',
            avgDaily,
            finishedVsAveragePercent,
            dailyGoal,
        };
        this.productivityCache.set(cacheKey, { data: result, expiresAt: Date.now() + 30000 });
        return result;
    }
    clearConversationsCache(tenantId) {
        if (!tenantId) {
            this.conversationsCache.clear();
            return;
        }
        for (const key of this.conversationsCache.keys()) {
            if (key.startsWith(`${tenantId}:`)) {
                this.conversationsCache.delete(key);
            }
        }
    }
    async findAllConversations(tenantId, userId, userRole, tab = 'waiting', departmentId, limit, search) {
        const isSearch = Boolean(search && search.trim().length > 0);
        const cleanSearch = isSearch ? search.trim() : '';
        const cacheKey = `${tenantId}:${userId}:${tab}:${departmentId || 'all'}:${limit || 500}:${cleanSearch}`;
        const cached = this.conversationsCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }
        const whereClause = { tenantId };
        const isMaster = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        let allowedDeptIds = [];
        if (!isMaster) {
            const userDepts = await this.prisma.userDepartment.findMany({
                where: { userId },
                select: { departmentId: true },
            });
            allowedDeptIds = userDepts.map(ud => ud.departmentId);
            if (departmentId && departmentId !== 'all') {
                if (allowedDeptIds.includes(departmentId)) {
                    whereClause.departmentId = departmentId;
                }
                else {
                    whereClause.departmentId = { in: allowedDeptIds.length > 0 ? allowedDeptIds : ['__NONE__'] };
                }
            }
        }
        else {
            if (departmentId && departmentId !== 'all') {
                whereClause.departmentId = departmentId;
            }
        }
        if (isSearch) {
            const cleanDigits = cleanSearch.replace(/\D/g, '');
            const orConditions = [
                { contact: { name: { contains: cleanSearch, mode: 'insensitive' } } },
                { contact: { phone: { contains: cleanDigits || cleanSearch } } },
                { contact: { whatsappLid: { contains: cleanSearch } } },
            ];
            if (cleanDigits.length >= 4) {
                orConditions.push({ contact: { phone: { contains: cleanDigits } } });
                if (cleanDigits.startsWith('55') && cleanDigits.length > 6) {
                    orConditions.push({ contact: { phone: { contains: cleanDigits.slice(2) } } });
                }
            }
            if (cleanDigits.length >= 8) {
                const last8 = cleanDigits.slice(-8);
                orConditions.push({ contact: { phone: { contains: last8 } } });
                if (cleanDigits.length === 10) {
                    const with9 = cleanDigits.slice(0, 2) + '9' + cleanDigits.slice(2);
                    orConditions.push({ contact: { phone: { contains: with9 } } });
                    orConditions.push({ contact: { phone: { contains: '55' + with9 } } });
                }
                else if (cleanDigits.length === 12 && cleanDigits.startsWith('55')) {
                    const with9 = cleanDigits.slice(0, 4) + '9' + cleanDigits.slice(4);
                    orConditions.push({ contact: { phone: { contains: with9 } } });
                }
                else if (cleanDigits.length === 11 && cleanDigits[2] === '9') {
                    const without9 = cleanDigits.slice(0, 2) + cleanDigits.slice(3);
                    orConditions.push({ contact: { phone: { contains: without9 } } });
                    orConditions.push({ contact: { phone: { contains: '55' + without9 } } });
                }
                else if (cleanDigits.length === 13 && cleanDigits.startsWith('55') && cleanDigits[4] === '9') {
                    const without9 = cleanDigits.slice(0, 4) + cleanDigits.slice(5);
                    orConditions.push({ contact: { phone: { contains: without9 } } });
                }
            }
            whereClause.OR = orConditions;
            if (!isMaster) {
                whereClause.AND = [
                    {
                        OR: [
                            { assignedTo: userId },
                            {
                                assignedTo: null,
                                departmentId: { in: allowedDeptIds.length > 0 ? allowedDeptIds : ['__NONE__'] }
                            }
                        ]
                    }
                ];
            }
        }
        else {
            if (tab === 'all' || tab === 'unread') {
                if (!isMaster) {
                    whereClause.assignedTo = userId;
                }
            }
            else if (tab === 'resolved') {
                whereClause.status = { in: ['resolved', 'closed'] };
                if (!isMaster) {
                    whereClause.assignedTo = userId;
                }
            }
            else if (tab === 'mine') {
                whereClause.status = { in: ['open', 'human_takeover', 'in_progress'] };
                if (!isMaster) {
                    whereClause.assignedTo = userId;
                    if (!departmentId || departmentId === 'all') {
                        delete whereClause.departmentId;
                        delete whereClause.OR;
                    }
                }
            }
            else {
                whereClause.OR = [
                    { status: { in: ['waiting', 'bot_active'] } },
                    { assignedTo: null, status: { notIn: ['resolved', 'closed'] } }
                ];
                if (!isMaster) {
                    whereClause.departmentId = { in: allowedDeptIds.length > 0 ? allowedDeptIds : ['__NONE__'] };
                }
            }
        }
        const conversations = await this.prisma.conversation.findMany({
            where: whereClause,
            select: {
                id: true,
                tenantId: true,
                status: true,
                assignedTo: true,
                departmentId: true,
                createdAt: true,
                updatedAt: true,
                contact: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        avatarUrl: true,
                        tags: true,
                        source: true,
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        content: true,
                        type: true,
                        direction: true,
                        createdAt: true,
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: limit && limit > 0 ? limit : 500,
        });
        const userIds = [...new Set(conversations.map(c => c.assignedTo).filter(Boolean))];
        let userMap = new Map();
        if (userIds.length > 0) {
            const users = await this.prisma.user.findMany({
                where: { id: { in: userIds } },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    role: true,
                    departments: {
                        include: { department: true }
                    }
                }
            });
            userMap = new Map(users.map(u => [u.id, u]));
        }
        for (const conv of conversations) {
            conv.assignedUser = conv.assignedTo ? userMap.get(conv.assignedTo) || null : null;
            if (conv.contact) {
                const av = conv.contact.avatarUrl;
                if (!av || av === 'null' || av === 'undefined' || av.includes('unsplash.com')) {
                    conv.contact.avatarUrl = null;
                }
            }
        }
        conversations.sort((a, b) => {
            const timeA = a.messages && a.messages.length > 0 && a.messages[0].createdAt
                ? new Date(a.messages[0].createdAt).getTime()
                : new Date(a.updatedAt || a.createdAt).getTime();
            const timeB = b.messages && b.messages.length > 0 && b.messages[0].createdAt
                ? new Date(b.messages[0].createdAt).getTime()
                : new Date(b.updatedAt || b.createdAt).getTime();
            return timeB - timeA;
        });
        this.conversationsCache.set(cacheKey, { data: conversations, expiresAt: Date.now() + 5000 });
        return conversations;
    }
    async getConversationMessages(tenantId, conversationId) {
        try {
            return await this.prisma.message.findMany({
                where: { tenantId, conversationId },
                orderBy: { createdAt: 'asc' }
            });
        }
        catch (err) {
            this.logger.error(`Erro ao buscar mensagens da conversa ${conversationId}: ${err?.message}`);
            return [];
        }
    }
    async resolveDepartmentByPhone(tenantId, phone, state) {
        if (!phone && !state)
            return null;
        try {
            const departments = await this.prisma.department.findMany({
                where: { tenantId },
                select: { id: true, name: true }
            });
            if (!departments || departments.length === 0)
                return null;
            const dddToRegion = {
                '51': 1, '53': 1, '54': 1, '55': 1,
                '47': 1, '48': 1, '49': 1,
                '41': 1, '42': 1, '43': 1, '44': 1, '45': 1, '46': 1,
                '67': 2, '65': 2, '66': 2,
                '91': 2, '93': 2, '94': 2, '69': 2, '95': 2, '68': 2, '92': 2, '97': 2, '96': 2,
                '62': 3, '64': 3, '61': 3,
                '31': 3, '32': 3, '33': 3, '34': 3, '35': 3, '37': 3, '38': 3,
                '11': 3, '12': 3, '13': 3, '14': 3, '15': 3, '16': 3, '17': 3, '18': 3, '19': 3,
                '21': 3, '22': 3, '24': 3, '27': 3, '28': 3,
                '63': 4, '71': 4, '73': 4, '74': 4, '75': 4, '77': 4,
                '98': 5, '99': 5, '86': 5, '89': 5,
                '85': 6, '88': 6, '84': 6, '83': 6, '79': 6, '81': 6, '87': 6, '82': 6
            };
            const ufToRegion = {
                'RS': 1, 'SC': 1, 'PR': 1,
                'MS': 2, 'MT': 2, 'PA': 2, 'RO': 2, 'RR': 2, 'AC': 2, 'AM': 2, 'AP': 2,
                'GO': 3, 'DF': 3, 'MG': 3, 'SP': 3, 'RJ': 3, 'ES': 3,
                'TO': 4, 'BA': 4,
                'MA': 5, 'PI': 5,
                'CE': 6, 'RN': 6, 'PB': 6, 'SE': 6, 'PE': 6, 'AL': 6
            };
            let targetRegionNum = null;
            if (phone && !phone.includes('@lid')) {
                const clean = phone.replace(/\D/g, '');
                let ddd = '';
                if (clean.startsWith('595')) {
                    targetRegionNum = 1;
                }
                else if (clean.length >= 10 && clean.length <= 13) {
                    const localPart = clean.startsWith('55') && clean.length >= 12 ? clean.slice(2) : clean;
                    if (localPart.length === 10 || localPart.length === 11) {
                        ddd = localPart.substring(0, 2);
                    }
                    else if (clean.length === 10 || clean.length === 11) {
                        ddd = clean.substring(0, 2);
                    }
                }
                if (ddd && dddToRegion[ddd]) {
                    targetRegionNum = dddToRegion[ddd];
                }
            }
            if (!targetRegionNum && state) {
                const uf = state.trim().toUpperCase();
                const byToken = departments.find(d => new RegExp(`(^|[^A-ZÀ-Ú])${uf}([^A-ZÀ-Ú]|$)`).test(d.name.toUpperCase()));
                if (byToken)
                    return byToken.id;
                if (ufToRegion[uf])
                    targetRegionNum = ufToRegion[uf];
            }
            if (targetRegionNum) {
                const matched = departments.find(d => {
                    const upper = d.name.toUpperCase();
                    return upper.includes(`REGIÃO ${targetRegionNum}`) || upper.includes(`REGIAO ${targetRegionNum}`);
                });
                if (matched)
                    return matched.id;
            }
        }
        catch (e) {
            this.logger.warn(`Erro ao resolver departamento por telefone: ${e.message}`);
        }
        return null;
    }
    async getConversationByContact(tenantId, contactIdOrPhone) {
        const cleanDigits = (contactIdOrPhone || '').replace(/\D/g, '');
        let conversation = await this.prisma.conversation.findFirst({
            where: {
                tenantId,
                OR: [
                    { contactId: contactIdOrPhone },
                    ...(cleanDigits.length >= 8 ? [{ contact: { phone: { contains: cleanDigits } } }] : [])
                ]
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                },
                contact: true,
                department: {
                    select: { id: true, name: true, color: true }
                }
            }
        });
        if (!conversation) {
            const contact = await this.prisma.contact.findFirst({
                where: {
                    tenantId,
                    OR: [
                        { id: contactIdOrPhone },
                        ...(cleanDigits.length >= 8 ? [{ phone: { contains: cleanDigits } }] : [])
                    ]
                }
            });
            if (!contact) {
                throw new common_1.NotFoundException('Contato não encontrado.');
            }
            if (contact.phone) {
                conversation = await this.prisma.conversation.findFirst({
                    where: {
                        tenantId,
                        contact: { phone: contact.phone }
                    },
                    orderBy: { updatedAt: 'desc' },
                    include: {
                        messages: {
                            orderBy: { createdAt: 'asc' }
                        },
                        contact: true,
                        department: {
                            select: { id: true, name: true, color: true }
                        }
                    }
                });
            }
            if (!conversation) {
                const autoDeptId = await this.resolveDepartmentByPhone(tenantId, contact.phone, contact.state);
                conversation = await this.prisma.conversation.create({
                    data: {
                        tenantId,
                        contactId: contact.id,
                        departmentId: autoDeptId,
                        status: 'waiting',
                    },
                    include: {
                        messages: {
                            orderBy: { createdAt: 'asc' }
                        },
                        contact: true,
                        department: {
                            select: { id: true, name: true, color: true }
                        }
                    }
                });
            }
            else if (!conversation.departmentId && contact.phone) {
                const autoDeptId = await this.resolveDepartmentByPhone(tenantId, contact.phone, contact.state);
                if (autoDeptId) {
                    conversation = await this.prisma.conversation.update({
                        where: { id: conversation.id },
                        data: { departmentId: autoDeptId },
                        include: {
                            messages: {
                                orderBy: { createdAt: 'asc' }
                            },
                            contact: true,
                            department: {
                                select: { id: true, name: true, color: true }
                            }
                        }
                    });
                }
            }
        }
        if (conversation.contact) {
            const av = conversation.contact.avatarUrl;
            if (!av || av === 'null' || av === 'undefined' || av.includes('unsplash.com')) {
                conversation.contact.avatarUrl = null;
            }
        }
        return conversation;
    }
    async getConversationById(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { tenantId, id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                },
                contact: true,
                department: true
            }
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        if (conversation.contact) {
            const av = conversation.contact.avatarUrl;
            if (!av || av === 'null' || av === 'undefined' || av.includes('unsplash.com')) {
                conversation.contact.avatarUrl = null;
            }
        }
        if (conversation.assignedTo) {
            const user = await this.prisma.user.findUnique({
                where: { id: conversation.assignedTo },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    role: true,
                    departments: {
                        include: { department: true }
                    }
                }
            });
            conversation.assignedUser = user || null;
        }
        return conversation;
    }
    async takeoverConversation(tenantId, conversationId, userId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { status: 'human_takeover', assignedTo: userId },
            include: {
                contact: true,
                department: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
                departments: {
                    include: { department: true }
                }
            }
        });
        const convWithUser = { ...updated, assignedUser: user || null };
        this.clearConversationsCache(tenantId);
        this.chatGateway.emitConversationUpdated(tenantId, convWithUser);
        return convWithUser;
    }
    async releaseConversation(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                status: 'resolved',
                updatedAt: new Date()
            },
            include: {
                contact: true,
                department: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        this.clearConversationsCache(tenantId);
        this.chatGateway.emitConversationUpdated(tenantId, updated);
        return updated;
    }
    async returnToBot(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                status: 'bot_active',
                assignedTo: null,
                updatedAt: new Date()
            },
            include: {
                contact: true,
                department: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        this.clearConversationsCache(tenantId);
        this.chatGateway.emitConversationUpdated(tenantId, updated);
        return updated;
    }
    async reopenConversation(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                status: 'waiting',
                assignedTo: null,
                updatedAt: new Date()
            },
            include: {
                contact: true,
                department: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        this.clearConversationsCache(tenantId);
        this.chatGateway.emitConversationUpdated(tenantId, updated);
        return updated;
    }
    async markAsRead(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        await this.prisma.message.updateMany({
            where: {
                tenantId,
                conversationId,
                direction: 'INBOUND',
                status: { not: 'read' }
            },
            data: { status: 'read' }
        });
        this.chatGateway.emitConversationUpdated(tenantId, { ...conversation, unreadCount: 0 });
        return { success: true, conversationId, unreadCount: 0 };
    }
    async markAsUnread(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        this.chatGateway.emitConversationUpdated(tenantId, { ...conversation, unreadCount: 1 });
        return { success: true, conversationId, unreadCount: 1 };
    }
    async assignToUser(tenantId, conversationId, userId, operatorName, operatorId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true, department: true }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { assignedTo: userId, status: 'open' },
            include: {
                contact: true,
                department: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        const assignedUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
                departments: {
                    include: { department: true }
                }
            }
        });
        const convWithUser = { ...updated, assignedUser: assignedUser || null };
        this.clearConversationsCache(tenantId);
        this.chatGateway.emitConversationUpdated(tenantId, convWithUser);
        this.chatGateway.emitConversationTransferred(tenantId, {
            conversationId: updated.id,
            contact: updated.contact,
            department: updated.department,
            assignedTo: updated.assignedTo,
            assignedUser: assignedUser || null,
            transferredBy: operatorName || 'Um operador',
            transferredById: operatorId || null,
            action: 'ASSIGNED',
            transferredAt: new Date().toISOString()
        });
        if (this.notificationsService && updated.assignedTo) {
            const deptName = updated.department?.name || 'Atendimento';
            this.notificationsService.sendPushToUser(tenantId, updated.assignedTo, {
                title: `Novo atendimento atribuído · ${deptName}`,
                body: `${updated.contact?.name || 'Cliente'} foi atribuído a você por ${operatorName || 'um operador'}.`,
                url: `/inbox?conversationId=${updated.id}`,
                tag: `queue_${updated.id}`
            }).catch(() => { });
        }
        return convWithUser;
    }
    async transferToDepartment(tenantId, conversationId, departmentId, userId, operatorName, operatorId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const dept = await this.prisma.department.findUnique({
            where: { id: departmentId }
        });
        if (!dept || dept.tenantId !== tenantId)
            throw new common_1.NotFoundException('Departamento inválido.');
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                departmentId,
                status: userId ? 'open' : 'waiting',
                assignedTo: userId || null,
                updatedAt: conversation.updatedAt
            },
            include: {
                contact: true,
                department: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        let assignedUser = null;
        if (updated.assignedTo) {
            assignedUser = await this.prisma.user.findUnique({
                where: { id: updated.assignedTo },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    role: true,
                    departments: {
                        include: { department: true }
                    }
                }
            });
        }
        const convWithUser = { ...updated, assignedUser: assignedUser || null };
        this.clearConversationsCache(tenantId);
        this.chatGateway.emitConversationUpdated(tenantId, convWithUser);
        this.chatGateway.emitConversationTransferred(tenantId, {
            conversationId: updated.id,
            contact: updated.contact,
            department: updated.department,
            assignedTo: updated.assignedTo,
            assignedUser: assignedUser || null,
            transferredBy: operatorName || 'Um colega',
            transferredById: operatorId || null,
            action: 'TRANSFERRED',
            transferredAt: new Date().toISOString()
        });
        if (this.notificationsService) {
            const deptName = updated.department?.name || 'Atendimento';
            if (updated.assignedTo) {
                this.notificationsService.sendPushToUser(tenantId, updated.assignedTo, {
                    title: `Novo atendimento atribuído · ${deptName}`,
                    body: `${updated.contact?.name || 'Cliente'} foi atribuído a você por ${operatorName || 'um colega'}.`,
                    url: `/inbox?conversationId=${updated.id}`,
                    tag: `queue_${updated.id}`
                }).catch(() => { });
            }
            else if (updated.departmentId) {
                this.notificationsService.sendPushToDepartment(tenantId, updated.departmentId, {
                    title: `Novo atendimento na fila · ${deptName}`,
                    body: `${updated.contact?.name || 'Cliente'} aguarda atendimento na fila do setor ${deptName}.`,
                    url: `/inbox?conversationId=${updated.id}`,
                    tag: `queue_${updated.id}`
                }).catch(() => { });
            }
        }
        return convWithUser;
    }
    parseScheduledDate(scheduledAt, timezone) {
        if (!scheduledAt) {
            throw new common_1.BadRequestException('A data e o horário de agendamento são obrigatórios.');
        }
        const dateStr = scheduledAt.trim();
        const hasTimezone = /Z|[+-]\d{2}(:?\d{2})?$/.test(dateStr);
        let parsedDate;
        if (hasTimezone) {
            parsedDate = new Date(dateStr);
        }
        else {
            const offset = timezone === 'UTC' ? 'Z' : '-03:00';
            parsedDate = new Date(`${dateStr}${offset}`);
        }
        if (isNaN(parsedDate.getTime())) {
            throw new common_1.BadRequestException('Formato de data ou horário inválido para agendamento.');
        }
        const now = Date.now();
        if (parsedDate.getTime() <= now + 10000) {
            throw new common_1.BadRequestException('O horário de agendamento deve ser definido para um momento futuro.');
        }
        return parsedDate;
    }
    async scheduleMessage(tenantId, conversationId, payload) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        if (!payload.content || !payload.content.trim()) {
            throw new common_1.BadRequestException('O conteúdo da mensagem é obrigatório.');
        }
        const scheduledDate = this.parseScheduledDate(payload.scheduledAt, payload.timezone);
        const delayMs = Math.max(0, scheduledDate.getTime() - Date.now());
        const isInternal = payload.isInternal || false;
        const type = payload.type || 'text';
        const mediaUrl = payload.mediaUrl || null;
        const msg = await this.prisma.message.create({
            data: {
                tenantId,
                conversationId,
                providerMessageId: `scheduled_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                contactId: conversation.contactId,
                content: payload.content.trim(),
                type,
                mediaUrl,
                isInternal,
                direction: 'OUTBOUND',
                senderType: 'user',
                status: 'scheduled',
                scheduledAt: scheduledDate,
            }
        });
        await this.scheduledQueue.add('sendScheduledMessage', {
            messageId: msg.id,
            tenantId,
            conversationId,
        }, {
            delay: delayMs,
            jobId: `msg_scheduled_${msg.id}`,
            removeOnComplete: true,
        });
        this.chatGateway.emitNewMessage(tenantId, msg);
        return msg;
    }
    async getScheduledMessages(tenantId, conversationId) {
        try {
            return await this.prisma.message.findMany({
                where: {
                    tenantId,
                    conversationId,
                    status: 'scheduled',
                },
                orderBy: { scheduledAt: 'asc' }
            });
        }
        catch (err) {
            return [];
        }
    }
    async getAllScheduledMessages(tenantId) {
        try {
            return await this.prisma.message.findMany({
                where: {
                    tenantId,
                    status: 'scheduled',
                },
                include: {
                    contact: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            avatarUrl: true,
                        }
                    },
                    conversation: {
                        select: {
                            id: true,
                            status: true,
                        }
                    }
                },
                orderBy: { scheduledAt: 'asc' }
            });
        }
        catch (err) {
            return [];
        }
    }
    async batchCancelScheduledMessages(tenantId, messageIds) {
        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            throw new common_1.BadRequestException('Nenhum identificador de mensagem informado.');
        }
        const messages = await this.prisma.message.findMany({
            where: {
                id: { in: messageIds },
                tenantId,
                status: 'scheduled',
            }
        });
        const validIds = messages.map(m => m.id);
        await Promise.all(validIds.map(async (id) => {
            try {
                const job = await this.scheduledQueue.getJob(`msg_scheduled_${id}`);
                if (job)
                    await job.remove();
            }
            catch { }
        }));
        const result = await this.prisma.message.deleteMany({
            where: {
                id: { in: validIds },
                tenantId,
            }
        });
        return {
            success: true,
            canceledCount: result.count,
            canceledIds: validIds,
        };
    }
    async cancelScheduledMessage(tenantId, messageId) {
        const msg = await this.prisma.message.findUnique({
            where: { id: messageId }
        });
        if (!msg || msg.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Mensagem agendada não encontrada.');
        }
        if (msg.status !== 'scheduled') {
            throw new common_1.BadRequestException('Esta mensagem não possui agendamento pendente.');
        }
        try {
            const job = await this.scheduledQueue.getJob(`msg_scheduled_${msg.id}`);
            if (job)
                await job.remove();
        }
        catch {
        }
        await this.prisma.message.delete({
            where: { id: messageId }
        });
        return { success: true, messageId };
    }
    async sendManualMessage(tenantId, conversationId, payload) {
        if (payload.scheduledAt) {
            return this.scheduleMessage(tenantId, conversationId, {
                content: payload.content || '',
                scheduledAt: payload.scheduledAt,
                timezone: payload.timezone,
                isInternal: payload.isInternal,
                type: payload.type,
                mediaUrl: payload.mediaUrl,
            });
        }
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const isInternal = payload.isInternal || false;
        const type = payload.type || 'text';
        const mediaUrl = payload.mediaUrl || null;
        const initialStatus = isInternal ? 'delivered' : 'pending';
        const tempMessageId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let quotedMessageData = payload.quotedMessage || null;
        let quotedEvolutionPayload = null;
        if (payload.quotedMessageId) {
            const quotedDbMsg = await this.prisma.message.findUnique({
                where: { id: payload.quotedMessageId },
                include: { contact: true }
            });
            if (quotedDbMsg) {
                quotedMessageData = {
                    id: quotedDbMsg.id,
                    providerMessageId: quotedDbMsg.providerMessageId,
                    content: quotedDbMsg.content,
                    type: quotedDbMsg.type,
                    mediaUrl: quotedDbMsg.mediaUrl,
                    direction: quotedDbMsg.direction,
                    senderType: quotedDbMsg.senderType,
                    senderName: quotedDbMsg.direction === 'INBOUND' ? (quotedDbMsg.contact?.name || 'Cliente') : 'Você',
                };
                const cleanPhone = conversation.contact?.phone?.replace(/\D/g, '') || '';
                const remoteJid = cleanPhone ? `${cleanPhone}@s.whatsapp.net` : '';
                const fromMe = quotedDbMsg.direction === 'OUTBOUND';
                quotedEvolutionPayload = {
                    key: {
                        id: quotedDbMsg.providerMessageId,
                        remoteJid,
                        fromMe,
                    },
                    message: {
                        conversation: quotedDbMsg.content || (quotedDbMsg.type === 'image' ? 'Foto' : quotedDbMsg.type === 'video' ? 'Vídeo' : quotedDbMsg.type === 'audio' ? 'Áudio' : 'Mídia'),
                    },
                };
            }
        }
        let msg = await this.prisma.message.create({
            data: {
                tenantId,
                conversationId,
                providerMessageId: tempMessageId,
                contactId: conversation.contactId,
                content: payload.content || '',
                type,
                mediaUrl,
                isInternal,
                direction: 'OUTBOUND',
                senderType: 'user',
                status: initialStatus,
                quotedMessage: quotedMessageData,
            }
        });
        if (!isInternal && conversation.contact?.phone) {
            try {
                let sendRes = null;
                if ((type === 'image' || type === 'document' || type === 'video') && mediaUrl) {
                    sendRes = await this.messagingService.sendMedia({
                        tenantId,
                        phone: conversation.contact.phone,
                        type: type,
                        mediaUrl,
                        content: payload.content || '',
                        filename: payload.filename ||
                            (payload.content?.includes('.')
                                ? payload.content
                                : type === 'document'
                                    ? 'documento.pdf'
                                    : type === 'video'
                                        ? 'video.mp4'
                                        : 'imagem.jpg'),
                        instanceId: payload.instanceId,
                        quoted: quotedEvolutionPayload,
                    });
                }
                else if (type === 'audio' && mediaUrl) {
                    sendRes = await this.messagingService.sendAudio({
                        tenantId,
                        phone: conversation.contact.phone,
                        audioUrl: mediaUrl,
                        instanceId: payload.instanceId,
                    });
                }
                else if (type === 'sticker' && mediaUrl) {
                    sendRes = await this.messagingService.sendSticker({
                        tenantId,
                        phone: conversation.contact.phone,
                        stickerUrl: mediaUrl,
                        instanceId: payload.instanceId,
                        quoted: quotedEvolutionPayload,
                    });
                }
                else {
                    sendRes = await this.messagingService.sendText({
                        tenantId,
                        phone: conversation.contact.phone,
                        content: payload.content || '',
                        instanceId: payload.instanceId,
                        quoted: quotedEvolutionPayload,
                    });
                }
                if (sendRes?.success) {
                    const finalStatus = 'sent';
                    msg = await this.prisma.message.update({
                        where: { id: msg.id },
                        data: {
                            providerMessageId: sendRes.messageId || msg.providerMessageId,
                            status: finalStatus,
                        },
                    });
                    this.chatGateway.emitMessageStatusUpdated(tenantId, {
                        messageId: msg.id,
                        providerMessageId: msg.providerMessageId,
                        status: finalStatus,
                        conversationId,
                    });
                }
                else {
                    this.logger.error(`Falha no envio da mensagem ${msg.id} para ${conversation.contact.phone}: ${sendRes?.error}`);
                    const rawErrorStr = String(sendRes?.error || '');
                    const isNoWhatsApp = rawErrorStr.includes('"exists":false') ||
                        rawErrorStr.includes('"exists": false') ||
                        rawErrorStr.includes('exists:false') ||
                        rawErrorStr.includes('not-authorized') ||
                        rawErrorStr.includes('is not on WhatsApp') ||
                        rawErrorStr.includes('not registered on whatsapp');
                    const failStatus = isNoWhatsApp ? 'no_whatsapp' : 'failed';
                    msg = await this.prisma.message.update({
                        where: { id: msg.id },
                        data: { status: failStatus },
                    });
                    this.chatGateway.emitMessageStatusUpdated(tenantId, {
                        messageId: msg.id,
                        providerMessageId: msg.providerMessageId,
                        status: failStatus,
                        errorReason: isNoWhatsApp ? 'Contato sem WhatsApp ou número inválido' : 'Falha no envio',
                        conversationId,
                    });
                    if (isNoWhatsApp) {
                        const phoneDisplay = conversation.contact?.phone || 'informado';
                        const alertNote = await this.prisma.message.create({
                            data: {
                                tenantId,
                                conversationId,
                                contactId: conversation.contactId,
                                content: `⚠️ [Aviso do Sistema]: O envio falhou porque o número deste contato (${phoneDisplay}) não possui conta de WhatsApp ativa ou foi digitado incorretamente pelo cliente. Verifique o número ou tente contato via e-mail ou ligação telefônica.`,
                                type: 'text',
                                isInternal: true,
                                fromMe: false,
                                direction: 'INBOUND',
                                senderType: 'system',
                                status: 'delivered',
                            },
                        }).catch((e) => {
                            this.logger.warn(`Erro ao criar nota de aviso de número sem WhatsApp: ${e.message}`);
                            return null;
                        });
                        if (alertNote) {
                            this.chatGateway.emitNewMessage(tenantId, alertNote);
                        }
                    }
                }
            }
            catch (err) {
                this.logger.error(`Exceção ao disparar mensagem WhatsApp: ${err.message}`);
                msg = await this.prisma.message.update({
                    where: { id: msg.id },
                    data: { status: 'failed' },
                });
                this.chatGateway.emitMessageStatusUpdated(tenantId, {
                    messageId: msg.id,
                    providerMessageId: msg.providerMessageId,
                    status: 'failed',
                    conversationId,
                });
            }
        }
        if (!isInternal && (conversation.status === 'bot_active' || conversation.status === 'waiting')) {
            const updatedConv = await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'human_takeover', updatedAt: new Date() },
                include: { contact: true, department: true }
            });
            this.chatGateway.emitConversationUpdated(tenantId, updatedConv);
        }
        else {
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            });
        }
        this.clearConversationsCache(tenantId);
        this.chatGateway.emitNewMessage(tenantId, msg);
        return msg;
    }
    async sendTemplateMessage(tenantId, conversationId, body) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        if (!conversation.contact?.phone) {
            throw new common_1.BadRequestException('Contato sem telefone cadastrado.');
        }
        const templateName = body.templateName || 'hello_world';
        const languageCode = body.languageCode || (templateName === 'hello_world' ? 'en_US' : 'pt_BR');
        const contactName = conversation.contact.name || 'Cliente';
        const cleanFirstName = contactName.split(' ')[0] || 'Cliente';
        let components = body.components;
        if (!components && templateName !== 'hello_world') {
            components = [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: cleanFirstName }
                    ]
                }
            ];
        }
        const tempMessageId = `template_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const templateDisplayText = templateName === 'hello_world'
            ? `📄 [Modelo de Retomada WhatsApp]: Olá! Estamos retomando nosso atendimento.`
            : `📄 [Modelo: ${templateName}]: Olá ${cleanFirstName}! Retomamos o contato para dar sequência ao seu atendimento.`;
        let msg = await this.prisma.message.create({
            data: {
                tenantId,
                conversationId,
                providerMessageId: tempMessageId,
                contactId: conversation.contactId,
                content: templateDisplayText,
                type: 'template',
                isInternal: false,
                direction: 'OUTBOUND',
                senderType: 'user',
                status: 'pending',
            }
        });
        this.chatGateway.emitNewMessage(tenantId, {
            ...msg,
            contact: { phone: conversation.contact.phone, name: conversation.contact.name, avatarUrl: conversation.contact.avatarUrl }
        });
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });
        const sendRes = await this.messagingService.sendTemplate({
            tenantId,
            phone: conversation.contact.phone,
            templateName,
            languageCode,
            components,
            instanceId: body.instanceId,
        });
        if (sendRes.success) {
            msg = await this.prisma.message.update({
                where: { id: msg.id },
                data: {
                    providerMessageId: sendRes.messageId || msg.providerMessageId,
                    status: 'sent',
                }
            });
            this.chatGateway.emitMessageStatusUpdated(tenantId, {
                messageId: msg.id,
                providerMessageId: msg.providerMessageId,
                status: 'sent',
                conversationId,
            });
            return { success: true, message: msg };
        }
        else {
            this.logger.error(`Falha no envio de Template Meta: ${sendRes.error}`);
            msg = await this.prisma.message.update({
                where: { id: msg.id },
                data: { status: 'failed' }
            });
            this.chatGateway.emitMessageStatusUpdated(tenantId, {
                messageId: msg.id,
                providerMessageId: msg.providerMessageId,
                status: 'failed',
                conversationId,
            });
            return { success: false, error: sendRes.error, message: msg };
        }
    }
    async sendManualMessageToContact(tenantId, contactId, payload, userId) {
        let conversation = await this.prisma.conversation.findFirst({
            where: { tenantId, contactId },
            orderBy: { updatedAt: 'desc' }
        });
        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: {
                    tenantId,
                    contactId,
                    status: 'human_takeover',
                    assignedTo: userId
                }
            });
        }
        return this.sendManualMessage(tenantId, conversation.id, payload);
    }
    async sendManualAudioMessage(tenantId, conversationId, file, payload) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const isInternal = payload.isInternal || false;
        let finalBuffer = file.buffer;
        let finalMimeType = 'audio/ogg';
        let ext = 'ogg';
        const tempInput = path.join(os.tmpdir(), `input_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.webm`);
        const tempOutput = path.join(os.tmpdir(), `output_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.ogg`);
        try {
            await fs.promises.writeFile(tempInput, file.buffer);
            await execAsync(`ffmpeg -y -i "${tempInput}" -c:a libopus -b:a 32k -ac 1 -ar 24000 -vn "${tempOutput}"`);
            finalBuffer = await fs.promises.readFile(tempOutput);
            finalMimeType = 'audio/ogg';
            ext = 'ogg';
        }
        catch (ffmpegErr) {
            finalBuffer = file.buffer;
            finalMimeType = file.mimetype || 'audio/webm';
            ext = file.mimetype?.includes('ogg') ? 'ogg' : 'webm';
        }
        finally {
            try {
                if (fs.existsSync(tempInput))
                    await fs.promises.unlink(tempInput);
            }
            catch (e) { }
            try {
                if (fs.existsSync(tempOutput))
                    await fs.promises.unlink(tempOutput);
            }
            catch (e) { }
        }
        const filename = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filePath, finalBuffer);
        const mediaUrl = `/api-backend/media/audio/${filename}`;
        const initialStatus = isInternal ? 'delivered' : 'pending';
        const tempMessageId = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let msg = await this.prisma.message.create({
            data: {
                tenantId,
                conversationId,
                providerMessageId: tempMessageId,
                contactId: conversation.contactId,
                content: payload.content || '🎤 Mensagem de voz',
                type: 'audio',
                mediaUrl,
                isInternal,
                direction: 'OUTBOUND',
                senderType: 'user',
                status: initialStatus,
            }
        });
        if (!isInternal && conversation.contact?.phone) {
            try {
                const sendRes = await this.messagingService.sendAudio({
                    tenantId,
                    phone: conversation.contact.phone,
                    audioBuffer: finalBuffer,
                    audioUrl: mediaUrl,
                    mimeType: finalMimeType,
                    instanceId: payload.instanceId,
                });
                if (sendRes?.success) {
                    const finalStatus = 'sent';
                    msg = await this.prisma.message.update({
                        where: { id: msg.id },
                        data: {
                            providerMessageId: sendRes.messageId || msg.providerMessageId,
                            status: finalStatus,
                        },
                    });
                    this.chatGateway.emitMessageStatusUpdated(tenantId, {
                        messageId: msg.id,
                        providerMessageId: msg.providerMessageId,
                        status: finalStatus,
                        conversationId,
                    });
                }
                else {
                    this.logger.error(`Falha no envio de áudio ${msg.id} para ${conversation.contact.phone}: ${sendRes?.error}`);
                    const rawErrorStr = String(sendRes?.error || '');
                    const isNoWhatsApp = rawErrorStr.includes('"exists":false') ||
                        rawErrorStr.includes('"exists": false') ||
                        rawErrorStr.includes('exists:false') ||
                        rawErrorStr.includes('not-authorized') ||
                        rawErrorStr.includes('is not on WhatsApp') ||
                        rawErrorStr.includes('not registered on whatsapp');
                    const failStatus = isNoWhatsApp ? 'no_whatsapp' : 'failed';
                    msg = await this.prisma.message.update({
                        where: { id: msg.id },
                        data: { status: failStatus },
                    });
                    this.chatGateway.emitMessageStatusUpdated(tenantId, {
                        messageId: msg.id,
                        providerMessageId: msg.providerMessageId,
                        status: failStatus,
                        errorReason: isNoWhatsApp ? 'Contato sem WhatsApp ou número inválido' : 'Falha no envio',
                        conversationId,
                    });
                    if (isNoWhatsApp) {
                        const phoneDisplay = conversation.contact?.phone || 'informado';
                        const alertNote = await this.prisma.message.create({
                            data: {
                                tenantId,
                                conversationId,
                                contactId: conversation.contactId,
                                content: `⚠️ [Aviso do Sistema]: O envio do áudio falhou porque o número deste contato (${phoneDisplay}) não possui conta de WhatsApp ativa ou foi digitado incorretamente pelo cliente. Verifique o número ou tente contato via e-mail ou ligação telefônica.`,
                                type: 'text',
                                isInternal: true,
                                fromMe: false,
                                direction: 'INBOUND',
                                senderType: 'system',
                                status: 'delivered',
                            },
                        }).catch((e) => {
                            this.logger.warn(`Erro ao criar nota de aviso de áudio sem WhatsApp: ${e.message}`);
                            return null;
                        });
                        if (alertNote) {
                            this.chatGateway.emitNewMessage(tenantId, alertNote);
                        }
                    }
                }
            }
            catch (err) {
                this.logger.error(`Exceção ao disparar áudio WhatsApp: ${err.message}`);
                msg = await this.prisma.message.update({
                    where: { id: msg.id },
                    data: { status: 'failed' },
                });
                this.chatGateway.emitMessageStatusUpdated(tenantId, {
                    messageId: msg.id,
                    providerMessageId: msg.providerMessageId,
                    status: 'failed',
                    conversationId,
                });
            }
        }
        if (conversation.status === 'bot_active' && !isInternal) {
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'human_takeover' }
            });
        }
        this.chatGateway.emitNewMessage(tenantId, msg);
        return msg;
    }
    async deleteMessage(tenantId, conversationId, messageId) {
        const message = await this.prisma.message.findFirst({
            where: { id: messageId, conversationId, tenantId },
            include: {
                contact: true,
            },
        });
        if (!message) {
            throw new common_1.NotFoundException('Mensagem não encontrada');
        }
        if (message.direction === 'OUTBOUND' && message.providerMessageId && !message.providerMessageId.startsWith('fallback_')) {
            try {
                const instances = await this.prisma.whatsAppInstance.findMany({
                    where: { tenantId },
                    orderBy: { isDefault: 'desc' },
                });
                const activeInst = instances.find(i => i.status === 'connected') || instances[0];
                if (activeInst) {
                    const set = activeInst.settings || {};
                    const instanceName = set.instanceName || activeInst.name || this.whatsappService.getSanitizedInstanceName(tenantId, activeInst.id);
                    const targetJid = message.contact.phone;
                    await this.whatsappService.deleteMessageForEveryone(tenantId, instanceName, targetJid, message.providerMessageId);
                }
            }
            catch (err) {
                this.logger.warn(`Erro ao deletar mensagem no WhatsApp Evolution: ${err.message}`);
            }
        }
        await this.prisma.message.delete({
            where: { id: message.id },
        });
        this.chatGateway.emitMessageDeleted(tenantId, {
            conversationId,
            messageId: message.id,
        });
        this.logger.log(`Mensagem [${message.id}] apagada com sucesso na conversa [${conversationId}]`);
        return { success: true, messageId: message.id };
    }
    async editMessage(tenantId, conversationId, messageId, newContent) {
        const cleanContent = (newContent || '').trim();
        if (!cleanContent) {
            throw new common_1.BadRequestException('O conteúdo da mensagem não pode ficar vazio.');
        }
        const message = await this.prisma.message.findFirst({
            where: { id: messageId, conversationId, tenantId },
            include: {
                contact: true,
            },
        });
        if (!message) {
            throw new common_1.NotFoundException('Mensagem não encontrada.');
        }
        if (message.direction !== 'OUTBOUND') {
            throw new common_1.BadRequestException('Apenas mensagens enviadas pelo atendente podem ser editadas.');
        }
        if (!message.isInternal &&
            message.providerMessageId &&
            !message.providerMessageId.startsWith('fallback_') &&
            !message.providerMessageId.startsWith('manual_')) {
            try {
                const instances = await this.prisma.whatsAppInstance.findMany({
                    where: { tenantId },
                    orderBy: { isDefault: 'desc' },
                });
                const activeInst = instances.find(i => i.status === 'connected' || i.status === 'open') || instances[0];
                if (activeInst && message.contact) {
                    const set = activeInst.settings || {};
                    const instanceName = set.instanceName || activeInst.name || this.whatsappService.getSanitizedInstanceName(tenantId, activeInst.id);
                    const targetJid = message.contact.phone || message.contact.whatsappLid || '';
                    if (targetJid) {
                        await this.whatsappService.editMessageForEveryone(tenantId, instanceName, targetJid, message.providerMessageId, cleanContent);
                    }
                }
            }
            catch (err) {
                this.logger.warn(`Erro ao editar mensagem no WhatsApp Evolution: ${err.message}`);
            }
        }
        const updated = await this.prisma.message.update({
            where: { id: message.id },
            data: {
                content: cleanContent,
            },
        });
        this.clearConversationsCache(tenantId);
        this.chatGateway.emitMessageEdited(tenantId, {
            conversationId,
            messageId: updated.id,
            content: cleanContent,
            isEdited: true,
        });
        this.logger.log(`Mensagem [${message.id}] editada com sucesso na conversa [${conversationId}]`);
        return {
            success: true,
            message: {
                ...updated,
                isEdited: true,
            },
        };
    }
    async sendReaction(tenantId, conversationId, messageId, reaction, userId, userName) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true },
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message || message.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Mensagem não encontrada.');
        }
        let currentReactions = Array.isArray(message.reactions) ? [...message.reactions] : [];
        const userIdentifier = userId || 'operator';
        const existingIndex = currentReactions.findIndex(r => r.userId === userIdentifier || (r.fromMe && !r.userId));
        let finalReaction = reaction ? reaction.trim() : '';
        if (finalReaction.length > 0) {
            const newReactionObj = {
                emoji: finalReaction,
                userId: userIdentifier,
                userName: userName || 'Atendente',
                fromMe: true,
                timestamp: Date.now(),
            };
            if (existingIndex >= 0) {
                if (currentReactions[existingIndex].emoji === finalReaction) {
                    currentReactions.splice(existingIndex, 1);
                    finalReaction = '';
                }
                else {
                    currentReactions[existingIndex] = newReactionObj;
                }
            }
            else {
                currentReactions.push(newReactionObj);
            }
        }
        else {
            if (existingIndex >= 0) {
                currentReactions.splice(existingIndex, 1);
            }
        }
        const updatedMessage = await this.prisma.message.update({
            where: { id: message.id },
            data: { reactions: currentReactions },
        });
        this.chatGateway.emitMessageReactionUpdated(tenantId, {
            messageId: message.id,
            conversationId: message.conversationId,
            reactions: currentReactions,
        });
        if (message.providerMessageId && conversation.contact?.phone && !message.providerMessageId.startsWith('fallback_')) {
            this.messagingService.sendReaction({
                tenantId,
                phone: conversation.contact.phone,
                providerMessageId: message.providerMessageId,
                reaction: finalReaction,
                fromMe: message.direction === 'OUTBOUND',
            }).catch(err => {
                this.logger.error(`Falha ao sincronizar reação com WhatsApp: ${err.message}`);
            });
        }
        return updatedMessage;
    }
    async handleIncomingReaction(tenantId, providerMessageId, reactionEmoji, senderJid, fromMe) {
        const message = await this.prisma.message.findFirst({
            where: { tenantId, providerMessageId },
        });
        if (!message) {
            return null;
        }
        let currentReactions = Array.isArray(message.reactions) ? [...message.reactions] : [];
        const senderKey = fromMe ? 'me' : (senderJid || 'contact');
        const existingIndex = currentReactions.findIndex(r => r.senderKey === senderKey || (fromMe && r.fromMe) || (!fromMe && !r.fromMe));
        const emoji = reactionEmoji ? reactionEmoji.trim() : '';
        if (emoji.length > 0) {
            const reactionObj = {
                emoji,
                senderKey,
                fromMe,
                timestamp: Date.now(),
            };
            if (existingIndex >= 0) {
                currentReactions[existingIndex] = reactionObj;
            }
            else {
                currentReactions.push(reactionObj);
            }
        }
        else {
            if (existingIndex >= 0) {
                currentReactions.splice(existingIndex, 1);
            }
        }
        const updated = await this.prisma.message.update({
            where: { id: message.id },
            data: { reactions: currentReactions },
        });
        this.chatGateway.emitMessageReactionUpdated(tenantId, {
            messageId: message.id,
            conversationId: message.conversationId,
            reactions: currentReactions,
        });
        return updated;
    }
    async deleteConversation(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { id: conversationId, tenantId },
            include: { contact: true },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversa não encontrada');
        }
        await this.prisma.message.deleteMany({
            where: { conversationId, tenantId },
        });
        try {
            await this.prisma.csatSurvey.deleteMany({
                where: { conversationId },
            });
        }
        catch (e) { }
        await this.prisma.conversation.delete({
            where: { id: conversationId },
        });
        this.chatGateway.emitConversationDeleted(tenantId, { conversationId });
        this.logger.log(`Conversa [${conversationId}] apagada com sucesso no tenant [${tenantId}]`);
        return { success: true, conversationId };
    }
    async syncOfflineMessages(tenantId, force = false) {
        if (ChatService_1.activeSyncs.has(tenantId)) {
            this.logger.log(`[Offline Sync] Ignorado: sincronização já em andamento para o tenant [${tenantId}].`);
            return { syncedCount: 0, updatedCount: 0 };
        }
        const lastSync = ChatService_1.lastSyncTimes.get(tenantId) || 0;
        if (!force && Date.now() - lastSync < 3 * 60 * 1000) {
            this.logger.log(`[Offline Sync] Ignorado: cooldown ativo (última execução há menos de 3 min) para o tenant [${tenantId}].`);
            return { syncedCount: 0, updatedCount: 0 };
        }
        ChatService_1.activeSyncs.add(tenantId);
        ChatService_1.lastSyncTimes.set(tenantId, Date.now());
        try {
            this.logger.log(`[Offline Sync] Iniciando sincronização retroativa (24h) para o tenant [${tenantId}]...`);
            const instances = await this.prisma.whatsAppInstance.findMany({
                where: { tenantId, status: { in: ['open', 'connected'] } },
            });
            if (!instances.length) {
                return { syncedCount: 0, updatedCount: 0 };
            }
            const evolutionInstances = instances.filter(inst => {
                const isMeta = (inst.token && inst.token.startsWith('EAA')) || Boolean(inst.phoneNumberId && (!inst.settings || inst.settings.provider !== 'evolution'));
                return !isMeta;
            });
            if (!evolutionInstances.length) {
                return { syncedCount: 0, updatedCount: 0 };
            }
            const { serverUrl, apiKey } = this.whatsappService.getEvolutionConfig();
            const cutoffTimestamp = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
            let syncedCount = 0;
            let updatedCount = 0;
            let allInstances = [];
            try {
                const allInstRes = await axios_1.default.get(`${serverUrl}/instance/fetchInstances`, {
                    headers: { apikey: apiKey },
                    timeout: 4000,
                });
                allInstances = Array.isArray(allInstRes.data) ? allInstRes.data : [];
            }
            catch { }
            for (const inst of evolutionInstances) {
                const targetInstanceName = inst.settings?.instanceName || (inst.name || '').replace(' (WhatsApp Web)', '').trim();
                if (!targetInstanceName)
                    continue;
                const matched = allInstances.find(item => {
                    const instObj = item.instance || item;
                    const rName = instObj.instanceName || instObj.name;
                    const status = instObj.status || instObj.connectionStatus;
                    return rName === targetInstanceName && (status === 'open' || status === 'connected');
                });
                if (!matched) {
                    this.logger.debug(`[Offline Sync] Instância [${targetInstanceName}] não encontrada ou desconectada na Evolution API. Pulando.`);
                    continue;
                }
                const cleanName = targetInstanceName;
                let recentMessages = [];
                try {
                    const res = await axios_1.default.post(`${serverUrl}/chat/findMessages/${cleanName}`, {}, {
                        headers: { apikey: apiKey, 'Content-Type': 'application/json' },
                        timeout: 10000,
                    });
                    if (Array.isArray(res.data)) {
                        recentMessages = res.data;
                    }
                }
                catch (e) {
                    this.logger.warn(`[Offline Sync] Falha ao consultar mensagens de ${cleanName}: ${e.message}`);
                }
                for (const rawMsg of recentMessages) {
                    const key = rawMsg.key || {};
                    const msgId = key.id;
                    const remoteJid = key.remoteJid || '';
                    const rawTs = rawMsg.messageTimestamp;
                    const msgTimestamp = typeof rawTs === 'object' && rawTs !== null ? Number(rawTs.low || 0) : Number(rawTs || 0);
                    if (!msgId || !remoteJid || remoteJid.includes('status@broadcast') || msgTimestamp < cutoffTimestamp) {
                        continue;
                    }
                    const isFromMe = Boolean(key.fromMe);
                    const messageObj = rawMsg.message || {};
                    const textBody = messageObj.conversation ||
                        messageObj.extendedTextMessage?.text ||
                        '';
                    const isAudio = !!messageObj.audioMessage || !!messageObj.ptt || rawMsg.messageType === 'audioMessage';
                    const isImage = !!messageObj.imageMessage || rawMsg.messageType === 'imageMessage';
                    const isVideo = !!messageObj.videoMessage || rawMsg.messageType === 'videoMessage';
                    const isDocument = !!messageObj.documentMessage || rawMsg.messageType === 'documentMessage';
                    const isLocation = !!messageObj.locationMessage || !!messageObj.liveLocationMessage || rawMsg.messageType === 'locationMessage';
                    const msgType = isAudio ? 'audio' : isImage ? 'image' : isVideo ? 'video' : isLocation ? 'location' : isDocument ? 'document' : 'text';
                    const existingMsg = await this.prisma.message.findUnique({
                        where: {
                            tenantId_providerMessageId: {
                                tenantId,
                                providerMessageId: msgId,
                            },
                        },
                    });
                    if (existingMsg) {
                        if (existingMsg.content === '[Mídia Recebida]' && !existingMsg.mediaUrl && (isAudio || isImage || isVideo || isDocument)) {
                            let mediaBase64 = rawMsg.base64 || messageObj.base64;
                            if (!mediaBase64) {
                                mediaBase64 = await this.whatsappService.getBase64FromEvolutionMedia(cleanName, messageObj, key);
                            }
                            if (mediaBase64) {
                                const mime = isAudio ? 'audio/ogg' : isImage ? 'image/jpeg' : isVideo ? 'video/mp4' : 'application/pdf';
                                const saved = await this.whatsappService.saveBase64Media(tenantId, mediaBase64, msgId, mime);
                                if (saved?.url) {
                                    await this.prisma.message.update({
                                        where: { id: existingMsg.id },
                                        data: { mediaUrl: saved.url, type: msgType },
                                    });
                                    updatedCount++;
                                }
                            }
                        }
                        continue;
                    }
                    const resolution = await this.whatsappService.resolveContactFromEvolution(tenantId, cleanName, remoteJid, rawMsg.pushName, null);
                    const realPhone = resolution.realPhone || (remoteJid.includes('@lid') ? null : remoteJid.replace(/\D/g, ''));
                    const targetPhone = realPhone || remoteJid;
                    let contact = await this.prisma.contact.findFirst({
                        where: {
                            tenantId,
                            OR: [
                                ...(remoteJid.includes('@lid') ? [{ whatsappLid: remoteJid }, { phone: remoteJid }] : []),
                                { phone: targetPhone },
                                ...(realPhone ? [{ phone: realPhone }, { whatsappLid: realPhone }] : []),
                            ],
                        },
                    });
                    if (!contact && resolution.avatarUrl) {
                        const photoId = this.whatsappService.extractPhotoId(resolution.avatarUrl);
                        if (photoId) {
                            contact = await this.prisma.contact.findFirst({
                                where: {
                                    tenantId,
                                    avatarUrl: { contains: photoId },
                                },
                                orderBy: { updatedAt: 'desc' },
                            });
                        }
                    }
                    if (!contact) {
                        contact = await this.prisma.contact.create({
                            data: {
                                tenantId,
                                phone: targetPhone,
                                whatsappLid: remoteJid.includes('@lid') ? remoteJid : null,
                                name: resolution.realName || rawMsg.pushName || (targetPhone.includes('@lid') ? 'Cliente WhatsApp' : `WhatsApp (${targetPhone})`),
                                avatarUrl: resolution.avatarUrl,
                                source: 'WhatsApp',
                            },
                        });
                    }
                    else {
                        const updateData = {};
                        if (remoteJid.includes('@lid') && contact.whatsappLid !== remoteJid) {
                            updateData.whatsappLid = remoteJid;
                        }
                        if (realPhone && (contact.phone?.includes('@lid') || contact.phone?.replace(/\D/g, '').length > 13)) {
                            updateData.phone = realPhone;
                        }
                        if (Object.keys(updateData).length > 0) {
                            contact = await this.prisma.contact.update({
                                where: { id: contact.id },
                                data: updateData,
                            });
                        }
                    }
                    let conversation = await this.prisma.conversation.findUnique({
                        where: { tenantId_contactId: { tenantId, contactId: contact.id } },
                    });
                    if (!conversation) {
                        conversation = await this.prisma.conversation.create({
                            data: {
                                tenantId,
                                contactId: contact.id,
                                status: 'waiting',
                            },
                        });
                    }
                    let mediaUrl = null;
                    if (isAudio || isImage || isVideo || isDocument) {
                        let mediaBase64 = rawMsg.base64 || messageObj.base64;
                        if (!mediaBase64) {
                            mediaBase64 = await this.whatsappService.getBase64FromEvolutionMedia(cleanName, messageObj, key);
                        }
                        if (mediaBase64) {
                            const mime = isAudio ? 'audio/ogg' : isImage ? 'image/jpeg' : isVideo ? 'video/mp4' : 'application/pdf';
                            const saved = await this.whatsappService.saveBase64Media(tenantId, mediaBase64, msgId, mime);
                            mediaUrl = saved?.url || null;
                        }
                    }
                    else if (isLocation) {
                        const locObj = messageObj.locationMessage || messageObj.liveLocationMessage;
                        if (locObj?.degreesLatitude && locObj?.degreesLongitude) {
                            mediaUrl = `https://maps.google.com/?q=${locObj.degreesLatitude},${locObj.degreesLongitude}`;
                        }
                    }
                    const content = textBody || (mediaUrl ? `[${msgType.toUpperCase()}]` : '[Mídia Recebida]');
                    const savedMsg = await this.prisma.message.create({
                        data: {
                            tenantId,
                            conversationId: conversation.id,
                            contactId: contact.id,
                            providerMessageId: msgId,
                            direction: isFromMe ? 'OUTBOUND' : 'INBOUND',
                            senderType: isFromMe ? 'user' : 'contact',
                            type: msgType,
                            content,
                            mediaUrl,
                            fromMe: isFromMe,
                            status: 'delivered',
                            createdAt: new Date(msgTimestamp * 1000),
                        },
                    });
                    await this.prisma.conversation.update({
                        where: { id: conversation.id },
                        data: { updatedAt: new Date(msgTimestamp * 1000) },
                    });
                    this.chatGateway.emitNewMessage(tenantId, {
                        ...savedMsg,
                        contactName: contact.name,
                        contactPhone: contact.phone,
                    });
                    syncedCount++;
                }
            }
            this.logger.log(`[Offline Sync Concluído] Mensagens sincronizadas: ${syncedCount} | Mídias recuperadas: ${updatedCount}`);
            return { syncedCount, updatedCount };
        }
        catch (err) {
            this.logger.error(`[Offline Sync Erro]: ${err.message}`);
            return { syncedCount: 0, updatedCount: 0 };
        }
        finally {
            ChatService_1.activeSyncs.delete(tenantId);
        }
    }
    async transcribeAudioMessage(tenantId, messageId) {
        const message = await this.prisma.message.findFirst({
            where: { id: messageId, tenantId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Mensagem não encontrada.');
        }
        if (message.audioTranscription) {
            return {
                messageId: message.id,
                audioTranscription: message.audioTranscription,
                cached: true,
            };
        }
        if (!message.mediaUrl) {
            throw new common_1.BadRequestException('Mensagem não possui arquivo de áudio associado.');
        }
        if (message.mediaUrl.includes('supabase.co') && message.mediaUrl.includes('lvdphjhftfjdifnzuazd')) {
            throw new common_1.BadRequestException('Áudio histórico do CRM anterior desativado. Arquivo não disponível para transcrição.');
        }
        let buffer = null;
        const mediaUrl = message.mediaUrl;
        const cleanUrl = mediaUrl.split('?')[0];
        const basename = path.basename(cleanUrl);
        const candidatePaths = [
            path.join(process.cwd(), 'uploads', 'audio', basename),
            path.join(process.cwd(), 'uploads', 'media', basename),
            path.join(process.cwd(), 'uploads', basename),
        ];
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                try {
                    buffer = fs.readFileSync(p);
                    break;
                }
                catch { }
            }
        }
        if (!buffer && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://'))) {
            try {
                const resp = await axios_1.default.get(mediaUrl, {
                    responseType: 'arraybuffer',
                    timeout: 15000,
                });
                buffer = Buffer.from(resp.data);
            }
            catch (err) {
                this.logger.error(`Erro ao obter áudio para transcrição (${mediaUrl}): ${err.message}`);
                throw new common_1.BadRequestException('Não foi possível baixar o arquivo de áudio para transcrição.');
            }
        }
        if (!buffer) {
            throw new common_1.BadRequestException('Arquivo de áudio não encontrado no servidor.');
        }
        let mimeType = 'audio/ogg';
        if (basename.endsWith('.mp3'))
            mimeType = 'audio/mpeg';
        else if (basename.endsWith('.m4a'))
            mimeType = 'audio/mp4';
        else if (basename.endsWith('.wav'))
            mimeType = 'audio/wav';
        const transcription = await this.aiService.transcribeAudio(buffer, basename, mimeType);
        if (!transcription) {
            throw new common_1.BadRequestException('Não foi possível transcrever o áudio ou nenhum áudio inteligível detectado.');
        }
        const updated = await this.prisma.message.update({
            where: { id: message.id },
            data: {
                audioTranscription: transcription,
            },
        });
        try {
            this.chatGateway.emitMessageTranscribed(tenantId, {
                messageId: updated.id,
                conversationId: updated.conversationId,
                audioTranscription: transcription,
            });
        }
        catch (e) {
            this.logger.warn(`Falha ao emitir socket messageTranscribed: ${e.message}`);
        }
        return {
            messageId: updated.id,
            audioTranscription: transcription,
            cached: false,
        };
    }
    async analyzeImageMessage(tenantId, messageId) {
        const message = await this.prisma.message.findFirst({
            where: { id: messageId, tenantId },
        });
        if (!message) {
            throw new common_1.NotFoundException('Mensagem não encontrada.');
        }
        if (!message.mediaUrl) {
            throw new common_1.BadRequestException('Mensagem não possui arquivo de imagem associado.');
        }
        let buffer = null;
        const mediaUrl = message.mediaUrl;
        const cleanUrl = mediaUrl.split('?')[0];
        const basename = path.basename(cleanUrl);
        const candidatePaths = [
            path.join(process.cwd(), 'uploads', 'media', basename),
            path.join(process.cwd(), 'uploads', 'images', basename),
            path.join(process.cwd(), 'uploads', basename),
        ];
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                try {
                    buffer = fs.readFileSync(p);
                    break;
                }
                catch { }
            }
        }
        if (!buffer && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://'))) {
            try {
                const resp = await axios_1.default.get(mediaUrl, {
                    responseType: 'arraybuffer',
                    timeout: 20000,
                });
                buffer = Buffer.from(resp.data);
            }
            catch (err) {
                this.logger.error(`Erro ao obter imagem para análise (${mediaUrl}): ${err.message}`);
                throw new common_1.BadRequestException('Não foi possível baixar o arquivo de imagem para análise.');
            }
        }
        if (!buffer) {
            throw new common_1.BadRequestException('Arquivo de imagem não encontrado no servidor.');
        }
        let mimeType = 'image/jpeg';
        if (basename.endsWith('.png'))
            mimeType = 'image/png';
        else if (basename.endsWith('.webp'))
            mimeType = 'image/webp';
        else if (basename.endsWith('.gif'))
            mimeType = 'image/gif';
        const visualAnalysis = await this.aiService.analyzeImage(buffer, mimeType, message.content);
        if (!visualAnalysis) {
            throw new common_1.BadRequestException('Não foi possível analisar a imagem.');
        }
        const cleanBaseContent = message.content
            ? message.content.replace(/\n*📷 \[Análise da Imagem\]:[\s\S]*$/i, '').trim()
            : '';
        const newContent = cleanBaseContent && cleanBaseContent !== '📷 Foto'
            ? `${cleanBaseContent}\n\n📷 [Análise da Imagem]: ${visualAnalysis}`
            : `📷 [Análise da Imagem]: ${visualAnalysis}`;
        const updated = await this.prisma.message.update({
            where: { id: message.id },
            data: {
                content: newContent,
            },
        });
        try {
            if (this.chatGateway) {
                this.chatGateway.emitMessageTranscribed(tenantId, {
                    messageId: updated.id,
                    conversationId: updated.conversationId,
                    audioTranscription: visualAnalysis,
                });
            }
        }
        catch (e) {
            this.logger.warn(`Falha ao emitir socket de atualização de mensagem: ${e.message}`);
        }
        return {
            messageId: updated.id,
            analysis: visualAnalysis,
            content: newContent,
        };
    }
};
exports.ChatService = ChatService;
ChatService.activeSyncs = new Set();
ChatService.lastSyncTimes = new Map();
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, bullmq_1.InjectQueue)('scheduled-messages')),
    __param(6, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messaging_service_1.MessagingService,
        whatsapp_service_1.WhatsappService,
        ai_service_1.AiService,
        chat_gateway_1.ChatGateway,
        bullmq_2.Queue,
        notifications_service_1.NotificationsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map