import { useCallback, useRef, useState } from 'react';
import {
  ChatMessage,
  GitHubModel,
  ModelTurnResult,
  PreviewDraft,
  RepositoryTarget,
  ToolResponsePayload,
  WorkflowMode,
} from '../services/GitHubModel';

export enum WorkflowStep {
  IDLE = 'IDLE',
  CHATTING = 'CHATTING',
  PREVIEW = 'PREVIEW',
  SUCCESS = 'SUCCESS',
}

interface ProxyContentBlock {
  type?: string;
  text?: string;
  resource?: {
    text?: string;
    uri?: string;
  };
}

interface GitHubFileMetadata {
  content: string;
  sha: string | null;
  branch: string;
  path: string;
}

interface GitHubProxyResult {
  content?: ProxyContentBlock[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export interface UseGitHubChatReturn {
  step: WorkflowStep;
  mode: WorkflowMode | null;
  repository: RepositoryTarget | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  previewDraft: PreviewDraft | null;
  startCreateMode: (owner: string, repo: string, branch: string) => Promise<void>;
  startUpdateMode: (owner: string, repo: string, branch: string) => Promise<void>;
  sendUserMessage: (message: string) => Promise<void>;
  confirmPublish: () => Promise<void>;
  goBackToChat: () => void;
  cancel: () => void;
}

const README_PATH = 'README.md';
const MAX_TOOL_ROUNDS = 6;

export function useGitHubChat(): UseGitHubChatReturn {
  const [step, setStep] = useState<WorkflowStep>(WorkflowStep.IDLE);
  const [mode, setMode] = useState<WorkflowMode | null>(null);
  const [repository, setRepository] = useState<RepositoryTarget | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewDraft, setPreviewDraft] = useState<PreviewDraft | null>(null);

  const modelRef = useRef<GitHubModel | null>(null);

  const initializeModel = useCallback(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not configured.');
    }

    return new GitHubModel(apiKey);
  }, []);

  const createMessage = useCallback((role: ChatMessage['role'], content: string): ChatMessage => {
    return {
      id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
    };
  }, []);

  const appendAssistantMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) {
        return;
      }

      setMessages((currentMessages) => [...currentMessages, createMessage('model', trimmed)]);
    },
    [createMessage],
  );

  const callGitHubProxy = useCallback(
    async (toolName: string, args: Record<string, unknown>): Promise<GitHubProxyResult> => {
      const response = await fetch('/api/github/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName,
          arguments: args,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | GitHubProxyResult
        | { error?: string }
        | null;

      if (!response.ok) {
        const message =
          payload && 'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : `GitHub proxy request failed for ${toolName}.`;
        throw new Error(message);
      }

      return (payload ?? {}) as GitHubProxyResult;
    },
    [],
  );

  const extractProxyText = useCallback((result: GitHubProxyResult): string => {
    const textParts =
      result.content
        ?.flatMap((block) => {
          if (block.type === 'text' && typeof block.text === 'string') {
            return [block.text];
          }

          if (block.type === 'resource' && typeof block.resource?.text === 'string') {
            return [block.resource.text];
          }

          return [];
        })
        .filter(Boolean) ?? [];

    return textParts.join('\n\n').trim();
  }, []);

  const parseGitHubFileMetadata = useCallback(
    (result: GitHubProxyResult, fallbackBranch: string, fallbackPath: string): GitHubFileMetadata => {
      const rawText = extractProxyText(result);
      const normalizedBranch = fallbackBranch.trim() || 'main';

      if (!rawText) {
        return {
          content: '',
          sha: null,
          branch: normalizedBranch,
          path: fallbackPath,
        };
      }

      try {
        const parsed = JSON.parse(rawText) as {
          content?: string;
          sha?: string;
          path?: string;
          url?: string;
          encoding?: string;
        };

        const content =
          typeof parsed.content === 'string'
            ? parsed.encoding === 'base64'
              ? atob(parsed.content.replace(/\n/g, ''))
              : parsed.content
            : rawText;

        const branchFromUrl =
          typeof parsed.url === 'string'
            ? new URL(parsed.url).searchParams.get('ref')
            : null;

        return {
          content,
          sha: typeof parsed.sha === 'string' ? parsed.sha : null,
          branch: branchFromUrl || normalizedBranch,
          path: typeof parsed.path === 'string' ? parsed.path : fallbackPath,
        };
      } catch {
        return {
          content: rawText,
          sha: null,
          branch: normalizedBranch,
          path: fallbackPath,
        };
      }
    },
    [extractProxyText],
  );

  const buildToolResponse = useCallback(
    async (toolName: string, args: Record<string, unknown>): Promise<ToolResponsePayload> => {
      if (toolName !== 'get_file_contents') {
        throw new Error(`Unsupported background tool: ${toolName}`);
      }

      const proxyResult = await callGitHubProxy(toolName, args);
      const owner = typeof args.owner === 'string' ? args.owner : '';
      const repo = typeof args.repo === 'string' ? args.repo : '';
      const path = typeof args.path === 'string' ? args.path : README_PATH;
      const branch = typeof args.branch === 'string' ? args.branch : 'main';
      const fileMetadata = parseGitHubFileMetadata(proxyResult, branch, path);

      return {
        name: toolName,
        response: {
          owner,
          repo,
          path: fileMetadata.path,
          branch: fileMetadata.branch,
          sha: fileMetadata.sha,
          found: !proxyResult.isError,
          content: fileMetadata.content,
          structuredContent: proxyResult.structuredContent ?? null,
          error:
            proxyResult.isError
              ? extractProxyText(proxyResult) || 'Unable to read file.'
              : null,
        },
      };
    },
    [callGitHubProxy, extractProxyText, parseGitHubFileMetadata],
  );

  const resolveModelTurn = useCallback(
    async (initialTurn: ModelTurnResult) => {
      if (!modelRef.current) {
        throw new Error('GitHub chat session is not ready.');
      }

      let currentTurn = initialTurn;
      const assistantTexts: string[] = [];

      for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        if (currentTurn.text.trim()) {
          assistantTexts.push(currentTurn.text.trim());
        }

        if (currentTurn.previewDraft) {
          const previewMessage =
            assistantTexts.join('\n\n').trim() ||
            'I drafted the README. Review the preview and publish when you are satisfied.';

          appendAssistantMessage(previewMessage);
          setPreviewDraft(currentTurn.previewDraft);
          setStep(WorkflowStep.PREVIEW);
          return;
        }

        const backgroundCalls = currentTurn.toolCalls.filter(
          (toolCall) => toolCall.name === 'get_file_contents',
        );

        if (backgroundCalls.length === 0) {
          const finalText = assistantTexts.join('\n\n').trim();
          if (finalText) {
            appendAssistantMessage(finalText);
          }
          return;
        }

        const toolResponses = await Promise.all(
          backgroundCalls.map((toolCall) =>
            buildToolResponse(toolCall.name, toolCall.args as Record<string, unknown>),
          ),
        );

        currentTurn = await modelRef.current.sendToolResponses(toolResponses);
      }

      throw new Error('Tool handling exceeded the allowed number of rounds.');
    },
    [appendAssistantMessage, buildToolResponse],
  );

  const startWorkflow = useCallback(
    async (nextMode: WorkflowMode, owner: string, repo: string, branch: string) => {
      const trimmedOwner = owner.trim();
      const trimmedRepo = repo.trim();
      const trimmedBranch = branch.trim() || 'main';

      if (!trimmedOwner || !trimmedRepo || !trimmedBranch) {
        throw new Error('Repository owner, repository name, and branch are required.');
      }

      setIsLoading(true);
      setError(null);
      setPreviewDraft(null);
      setMessages([]);

      try {
        const model = initializeModel();
        const nextRepository: RepositoryTarget = {
          owner: trimmedOwner,
          repo: trimmedRepo,
          path: README_PATH,
          branch: trimmedBranch,
        };

        await model.startChat(nextMode, {
          owner: trimmedOwner,
          repo: trimmedRepo,
          branch: trimmedBranch,
        });

        modelRef.current = model;
        setMode(nextMode);
        setRepository(nextRepository);
        setStep(WorkflowStep.CHATTING);

        const initialTurn = await model.beginWorkflow();
        await resolveModelTurn(initialTurn);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start GitHub chat.');
        setStep(WorkflowStep.IDLE);
        setMode(null);
        setRepository(null);
        modelRef.current = null;
      } finally {
        setIsLoading(false);
      }
    },
    [initializeModel, resolveModelTurn],
  );

  const startCreateMode = useCallback(
    async (owner: string, repo: string, branch: string) => {
      await startWorkflow(WorkflowMode.CREATE, owner, repo, branch);
    },
    [startWorkflow],
  );

  const startUpdateMode = useCallback(
    async (owner: string, repo: string, branch: string) => {
      await startWorkflow(WorkflowMode.UPDATE, owner, repo, branch);
    },
    [startWorkflow],
  );

  const sendUserMessage = useCallback(
    async (message: string) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || !modelRef.current || isLoading) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setMessages((currentMessages) => [...currentMessages, createMessage('user', trimmedMessage)]);

      try {
        const turn = await modelRef.current.sendUserMessage(trimmedMessage);
        await resolveModelTurn(turn);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message.');
      } finally {
        setIsLoading(false);
      }
    },
    [createMessage, isLoading, resolveModelTurn],
  );

  const confirmPublish = useCallback(async () => {
    if (!previewDraft) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const publishResult = await callGitHubProxy('create_or_update_file', {
        owner: previewDraft.owner,
        repo: previewDraft.repo,
        path: previewDraft.path,
        branch: previewDraft.branch,
        content: previewDraft.content,
        message: previewDraft.message,
      });

      if (publishResult.isError) {
        throw new Error(extractProxyText(publishResult) || 'GitHub publish failed.');
      }

      setStep(WorkflowStep.SUCCESS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish README.');
      setStep(WorkflowStep.PREVIEW);
    } finally {
      setIsLoading(false);
    }
  }, [callGitHubProxy, extractProxyText, previewDraft]);

  const goBackToChat = useCallback(() => {
    setStep(WorkflowStep.CHATTING);
  }, []);

  const cancel = useCallback(() => {
    setStep(WorkflowStep.IDLE);
    setMode(null);
    setRepository(null);
    setMessages([]);
    setPreviewDraft(null);
    setError(null);
    setIsLoading(false);
    modelRef.current = null;
  }, []);

  return {
    step,
    mode,
    repository,
    messages,
    isLoading,
    error,
    previewDraft,
    startCreateMode,
    startUpdateMode,
    sendUserMessage,
    confirmPublish,
    goBackToChat,
    cancel,
  };
}
