import { registerChatSocketEvents } from "./socketChatEvents.js";
import { registerDisconnectSocketEvents } from "./socketDisconnectEvents.js";
import { registerDuelSocketEvents } from "./socketDuelEvents.js";
import { registerGameSocketEvents } from "./socketGameEvents.js";
import { installSocketRateGuard } from "./socketGuards.js";
import { registerMatchSocketEvents } from "./socketMatchEvents.js";
import { registerRoomSocketEvents } from "./socketRoomEvents.js";

export function registerSocketEvents(socket, deps) {
  installSocketRateGuard(socket, {
    isDraining: () => deps.runtimeServiceState?.isDraining?.() ?? false,
    metrics: deps.metrics
  });

  registerMatchSocketEvents(socket, {
    io: deps.io,
    prisma: deps.prisma,
    refreshSocketUser: deps.refreshSocketUser,
    listWaitingPlayers: deps.listWaitingPlayers,
    hasBlacklistBetween: deps.hasBlacklistBetween,
    joinMatchmaking: deps.joinMatchmaking,
    leaveMatchmaking: deps.leaveMatchmaking,
    broadcastLobbyStats: deps.broadcastLobbyStats,
    normalizeGameModeId: deps.normalizeGameModeId,
    runtimeServiceState: deps.runtimeServiceState,
    metrics: deps.metrics
  });

  registerRoomSocketEvents(socket, {
    io: deps.io,
    prisma: deps.prisma,
    validateRoomCode: deps.validateRoomCode,
    validateOptionalRoomCode: deps.validateOptionalRoomCode,
    attachSocketToRoom: deps.attachSocketToRoom,
    leaveRoom: deps.leaveRoom,
    findRoomForUser: deps.findRoomForUser,
    getRoom: deps.getRoom,
    resumePayloadForUser: deps.resumePayloadForUser,
    roomView: deps.roomView,
    broadcastRoom: deps.broadcastRoom,
    broadcastRoomPresencePatch: deps.broadcastRoomPresencePatch,
    markRoomPreloadReady: deps.markRoomPreloadReady,
    runtimeServiceState: deps.runtimeServiceState,
    metrics: deps.metrics
  });

  registerGameSocketEvents(socket, {
    io: deps.io,
    handleGameAction: deps.handleGameAction,
    requestCounting: deps.requestCounting,
    respondCounting: deps.respondCounting,
    requestDraw: deps.requestDraw,
    respondDraw: deps.respondDraw,
    handleScoringAction: deps.handleScoringAction,
    broadcastRoom: deps.broadcastRoom,
    getRoom: deps.getRoom,
    metrics: deps.metrics
  });

  registerChatSocketEvents(socket, {
    io: deps.io,
    addChat: deps.addChat,
    broadcastRoom: deps.broadcastRoom,
    broadcastRoomPatch: deps.broadcastRoomPatch
  });

  registerDuelSocketEvents(socket, {
    refreshSocketUser: deps.refreshSocketUser,
    duelRequests: deps.duelRequests,
    normalizeGameModeId: deps.normalizeGameModeId,
    broadcastLobbyStats: deps.broadcastLobbyStats,
    runtimeServiceState: deps.runtimeServiceState,
    metrics: deps.metrics
  });

  registerDisconnectSocketEvents(socket, {
    io: deps.io,
    unregisterOnlineSocket: deps.unregisterOnlineSocket,
    detachSocket: deps.detachSocket,
    broadcastRoom: deps.broadcastRoom,
    broadcastRoomPresencePatch: deps.broadcastRoomPresencePatch,
    broadcastLobbyStats: deps.broadcastLobbyStats
  });
}
