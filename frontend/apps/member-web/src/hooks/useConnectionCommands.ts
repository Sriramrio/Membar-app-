import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { activeMemberId } from '@/features/network/selectors';
import { selectConnections } from '@/features/network/readModel';
import {
  blockMember,
  cancelConnectionRequest,
  createConversation,
  removeConnection,
  requestConnection,
  respondConnection,
} from '@/features/network/networkSlice';
import { stableClientId } from '@/utils/stableId';
import { useGovernedCommand } from './useGovernedCommand';

export function useConnectionCommands() {
  const dispatch = useAppDispatch();
  const command = useGovernedCommand();
  const memberId = useAppSelector(activeMemberId);
  const connections = useAppSelector(selectConnections);

  const currentFor = useCallback((targetId: string) => connections.find(c =>
    (c.ownerId === memberId && c.targetId === targetId) ||
    (c.ownerId === targetId && c.targetId === memberId)), [connections, memberId]);

  const runConnection = useCallback(async (
    commandName: 'connection.request'|'connection.respond'|'connection.cancel'|'connection.remove'|'connection.block',
    targetId: string,
    payload: Record<string, unknown>,
    previewAction: () => void,
  ) => {
    const current = currentFor(targetId);
    return command.execute({
      domain: 'member', policyId: commandName, command: commandName,
      aggregateType: 'Connection', aggregateId: current?.id ?? `${memberId}:${targetId}`,
      expectedVersion: current?.version, payload, previewAction,
    });
  }, [command.execute, currentFor, memberId]);

  const request = useCallback((targetId: string, purpose?: string, note?: string) =>
    runConnection('connection.request', targetId, { ownerId: memberId, targetId, purpose, note },
      () => dispatch(requestConnection({ ownerId: memberId, targetId, purpose, note }))),
    [dispatch, memberId, runConnection]);

  const respond = useCallback((targetId: string, status: 'connected'|'declined') =>
    runConnection('connection.respond', targetId, { ownerId: memberId, targetId, status },
      () => dispatch(respondConnection({ ownerId: memberId, targetId, status }))),
    [dispatch, memberId, runConnection]);

  const cancel = useCallback((targetId: string) =>
    runConnection('connection.cancel', targetId, { ownerId: memberId, targetId },
      () => dispatch(cancelConnectionRequest({ ownerId: memberId, targetId }))),
    [dispatch, memberId, runConnection]);

  const remove = useCallback((targetId: string) =>
    runConnection('connection.remove', targetId, { memberId, targetId },
      () => dispatch(removeConnection({ memberId, targetId }))),
    [dispatch, memberId, runConnection]);

  const block = useCallback((targetId: string) =>
    runConnection('connection.block', targetId, { memberId, targetId },
      () => dispatch(blockMember({ memberId, targetId }))),
    [dispatch, memberId, runConnection]);

  const createDirectConversation = useCallback(async (targetId: string, context?: string, subject?: string) => {
    const conversationId = stableClientId('conversation');
    const payload = { ownerId: memberId, targetId, conversationId, context, subject };
    const result = await command.execute({
      domain: 'member', policyId: 'converse.conversation.create', command: 'converse.conversation.create',
      aggregateType: 'Conversation', aggregateId: conversationId, payload,
      // previewAction: () => dispatch(createConversation(payload)),
    });
    const realId = (result.result as any)?.data?.id ?? (result.result as any)?.id ?? conversationId;
    return { ...result, conversationId: realId };
  }, [command.execute, dispatch, memberId]);

  return { memberId, busy: command.busy, error: command.error, retry: command.retry, clearError: command.clearError,
    request, respond, cancel, remove, block, createDirectConversation };
}
