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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    constructor() {
        this.logger = new common_1.Logger(ChatGateway_1.name);
    }
    handleConnection(client) {
        this.logger.log(`Cliente Web conectado no rádio: ${client.id}`);
        client.on('joinTenant', (tenantId) => {
            client.join(tenantId);
            this.logger.log(`Cliente ${client.id} entrou na sala do Tenant: ${tenantId}`);
        });
    }
    handleDisconnect(client) {
        this.logger.log(`Cliente desconectado: ${client.id}`);
    }
    emitNewMessage(tenantId, messageData) {
        if (this.server) {
            this.server.to(tenantId).emit('newMessage', messageData);
        }
        else {
            this.logger.warn('WebSocket server not initialized yet, skipping emitNewMessage');
        }
    }
    emitHandoff(tenantId, dealData) {
        if (this.server) {
            this.server.to(tenantId).emit('dealUpdated', dealData);
        }
        else {
            this.logger.warn('WebSocket server not initialized yet, skipping emitHandoff');
        }
    }
    emitConversationUpdated(tenantId, conversationData) {
        if (this.server) {
            this.server.to(tenantId).emit('conversationUpdated', conversationData);
        }
        else {
            this.logger.warn('WebSocket server not initialized yet, skipping emitConversationUpdated');
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map