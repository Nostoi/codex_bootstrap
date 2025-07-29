"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const graph_controller_1 = require("./graph.controller");
const graph_service_1 = require("./graph.service");
const graph_config_service_1 = require("./config/graph-config.service");
const graph_auth_service_1 = require("./auth/graph-auth.service");
const graph_auth_controller_1 = require("./auth/graph-auth.controller");
const calendar_sync_module_1 = require("./sync/calendar-sync.module");
let GraphModule = class GraphModule {
};
exports.GraphModule = GraphModule;
exports.GraphModule = GraphModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, calendar_sync_module_1.CalendarSyncModule],
        controllers: [graph_controller_1.GraphController, graph_auth_controller_1.GraphAuthController],
        providers: [graph_service_1.GraphService, graph_config_service_1.GraphConfigService, graph_auth_service_1.GraphAuthService],
        exports: [graph_service_1.GraphService, graph_config_service_1.GraphConfigService, graph_auth_service_1.GraphAuthService, calendar_sync_module_1.CalendarSyncModule],
    })
], GraphModule);
//# sourceMappingURL=graph.module.js.map