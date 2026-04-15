import {
  ChatSession,
  Content,
  FunctionCall,
  GenerateContentResult,
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAI,
  Part,
  SchemaType,
  Tool,
} from '@google/generative-ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export interface RepositoryTarget {
  owner: string;
  repo: string;
  path: string;
  branch: string;
}

export interface PreviewDraft extends RepositoryTarget {
  content: string;
  message: string;
}

export interface ToolResponsePayload {
  name: string;
  response: Record<string, unknown>;
}

export interface ModelTurnResult {
  text: string;
  toolCalls: FunctionCall[];
  previewDraft: PreviewDraft | null;
}

export enum WorkflowMode {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

const PRIMARY_GEMINI_MODEL = 'gemini-2.5-flash';
const FALLBACK_GEMINI_MODEL = 'gemini-2.0-flash';
const README_PATH = 'README.md';
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1200;

const GITHUB_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_file_contents',
        description: 'Read the contents of a file from a GitHub repository.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            owner: {
              type: SchemaType.STRING,
              description: 'GitHub repository owner or organization name.',
            },
            repo: {
              type: SchemaType.STRING,
              description: 'GitHub repository name.',
            },
            path: {
              type: SchemaType.STRING,
              description: 'Path to the file in the repository.',
            },
            branch: {
              type: SchemaType.STRING,
              description: 'Git branch containing the file.',
            },
          },
          required: ['owner', 'repo', 'path'],
        },
      },
      {
        name: 'create_or_update_file',
        description: 'Create or update a file in a GitHub repository.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            owner: {
              type: SchemaType.STRING,
              description: 'GitHub repository owner or organization name.',
            },
            repo: {
              type: SchemaType.STRING,
              description: 'GitHub repository name.',
            },
            path: {
              type: SchemaType.STRING,
              description: 'Path to the file in the repository.',
            },
            content: {
              type: SchemaType.STRING,
              description: 'Full file contents to write.',
            },
            message: {
              type: SchemaType.STRING,
              description: 'Commit message describing the change.',
            },
            branch: {
              type: SchemaType.STRING,
              description: 'Git branch where the file should be created or updated.',
            },
          },
          required: ['owner', 'repo', 'path', 'content', 'message', 'branch'],
        },
      },
    ],
  },
];

export class GitHubModel {
  private readonly genAI: GoogleGenerativeAI;
  private chatSession: ChatSession | null = null;
  private mode: WorkflowMode | null = null;
  private repository: RepositoryTarget | null = null;
  private activeModelName = PRIMARY_GEMINI_MODEL;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async startChat(
    mode: WorkflowMode,
    repository: Omit<RepositoryTarget, 'path'>,
  ): Promise<void> {
    this.mode = mode;
    this.repository = {
      ...repository,
      path: README_PATH,
    };
    this.activeModelName = PRIMARY_GEMINI_MODEL;
    this.chatSession = this.createChatSession(this.activeModelName);
  }

  async beginWorkflow(): Promise<ModelTurnResult> {
    const chatSession = this.getChatSession();

    if (!this.repository || !this.mode) {
      throw new Error('Chat session is missing repository context.');
    }

    const kickoffPrompt =
      this.mode === WorkflowMode.CREATE
        ? `Begin the CREATE README workflow for ${this.repository.owner}/${this.repository.repo}. Introduce yourself and ask the first interview question about the project's purpose.`
        : `Begin the UPDATE README workflow for ${this.repository.owner}/${this.repository.repo}. Immediately call get_file_contents for ${this.repository.path} before writing any natural-language reply.`;

    const result = await this.sendMessageWithRecovery(kickoffPrompt, chatSession);
    return this.parseTurnResult(result);
  }

  async sendUserMessage(message: string): Promise<ModelTurnResult> {
    const chatSession = this.getChatSession();
    const result = await this.sendMessageWithRecovery(message, chatSession);
    return this.parseTurnResult(result);
  }

  async sendToolResponses(payloads: ToolResponsePayload[]): Promise<ModelTurnResult> {
    const chatSession = this.getChatSession();

    const parts = payloads.map((payload) => ({
      functionResponse: {
        name: payload.name,
        response: payload.response,
      },
    }));

    const result = await this.sendMessageWithRecovery(parts, chatSession);
    return this.parseTurnResult(result);
  }

  private createChatSession(modelName: string, history?: Content[]): ChatSession {
    if (!this.mode || !this.repository) {
      throw new Error('Model configuration is not initialized.');
    }

    const model = this.genAI.getGenerativeModel({
      model: modelName,
      tools: GITHUB_TOOLS,
      systemInstruction: this.buildSystemInstruction(this.mode, this.repository),
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 8192,
      },
    });

    return model.startChat(history ? { history } : undefined);
  }

  private async sendMessageWithRecovery(
    request: string | Part[],
    initialSession: ChatSession,
  ): Promise<GenerateContentResult> {
    let session = initialSession;

    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt += 1) {
      try {
        return await session.sendMessage(request);
      } catch (error) {
        const status = this.getErrorStatus(error);
        const isLastRetry = attempt === MAX_RETRY_ATTEMPTS - 1;

        if (this.isQuotaExceededError(error)) {
          throw this.normalizeModelError(error);
        }

        if (this.shouldFallback(error) && this.activeModelName !== FALLBACK_GEMINI_MODEL) {
          session = await this.switchToFallbackModel(session);
          continue;
        }

        if (!this.isTransientError(status) || isLastRetry) {
          throw this.normalizeModelError(error);
        }

        await this.delay(BASE_RETRY_DELAY_MS * (attempt + 1));
        session = this.getChatSession();
      }
    }

    throw new Error('Gemini request failed after multiple retries.');
  }

  private async switchToFallbackModel(currentSession: ChatSession): Promise<ChatSession> {
    const history = await currentSession.getHistory();
    this.activeModelName = FALLBACK_GEMINI_MODEL;
    this.chatSession = this.createChatSession(FALLBACK_GEMINI_MODEL, history);
    return this.chatSession;
  }

  private getChatSession(): ChatSession {
    if (!this.chatSession) {
      throw new Error('GitHub chat session has not been initialized.');
    }

    return this.chatSession;
  }

  private getErrorStatus(error: unknown): number | null {
    if (error instanceof GoogleGenerativeAIFetchError && typeof error.status === 'number') {
      return error.status;
    }

    return null;
  }

  private isTransientError(status: number | null): boolean {
    return status === 429 || status === 500 || status === 503;
  }

  private shouldFallback(error: unknown): boolean {
    const status = this.getErrorStatus(error);
    return status === 503;
  }

  private normalizeModelError(error: unknown): Error {
    const status = this.getErrorStatus(error);

    if (status === 429 && this.isQuotaExceededError(error)) {
      const retryAfter = this.extractRetryDelay(error);
      return new Error(
        retryAfter
          ? `Gemini quota is exhausted for this project. Google asked to retry in about ${retryAfter}. Enable billing or use a different API key/project with available quota.`
          : 'Gemini quota is exhausted for this project. Enable billing or use a different API key/project with available quota.',
      );
    }

    if (status === 503) {
      return new Error(
        'Gemini is temporarily overloaded. The app retried automatically and may have switched models. Please try again in a few seconds.',
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('Gemini request failed.');
  }

  private isQuotaExceededError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();
    return message.includes('quota exceeded') || message.includes('billing details');
  }

  private extractRetryDelay(error: unknown): string | null {
    if (!(error instanceof Error)) {
      return null;
    }

    const match = error.message.match(/Please retry in ([^.]+)\./i);
    return match?.[1]?.trim() ?? null;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  private buildSystemInstruction(mode: WorkflowMode, repository: RepositoryTarget): string {
    const repoLabel = `${repository.owner}/${repository.repo}`;

    if (mode === WorkflowMode.CREATE) {
      return [
        'You are a senior technical writer creating repository README files.',
        `You are currently helping with ${repoLabel}.`,
        'Mandatory behavior for CREATE mode:',
        '- Do not use any tools at the start of the workflow.',
        '- Introduce yourself briefly and interview the user in a conversational way.',
        '- Ask one question at a time and prioritize: project purpose, key features, tech stack, installation, usage, and contribution/license details.',
        '- Ask follow-up questions when details are missing.',
        '- Keep chatting until the user clearly says they are satisfied and ready to publish.',
        '- Only after explicit satisfaction may you call create_or_update_file.',
        `- When you call create_or_update_file, use owner="${repository.owner}", repo="${repository.repo}", path="${repository.path}", and branch="${repository.branch}".`,
      ].join('\n');
    }

    return [
      'You are a senior technical writer updating repository README files.',
      `You are currently helping with ${repoLabel}.`,
      'Mandatory behavior for UPDATE mode:',
      '- On your very first assistant turn, you must call get_file_contents for README.md.',
      '- Do not write any natural-language response before calling get_file_contents.',
      '- After you receive the file contents, summarize the current README clearly and ask what specific updates the user wants.',
      '- Continue the chat until the user explicitly says they are satisfied and ready to publish.',
      '- Only then may you call create_or_update_file.',
      `- When you call get_file_contents, use owner="${repository.owner}", repo="${repository.repo}", path="${repository.path}", and branch="${repository.branch}".`,
      `- When you call create_or_update_file, use owner="${repository.owner}", repo="${repository.repo}", path="${repository.path}", and branch="${repository.branch}".`,
    ].join('\n');
  }

  private parseTurnResult(result: GenerateContentResult): ModelTurnResult {
    const response = result.response;
    const toolCalls = response.functionCalls() ?? [];

    let text = '';
    try {
      text = response.text().trim();
    } catch {
      text = '';
    }

    return {
      text,
      toolCalls,
      previewDraft: this.extractPreviewDraft(toolCalls),
    };
  }

  private extractPreviewDraft(toolCalls: FunctionCall[]): PreviewDraft | null {
    const call = toolCalls.find((toolCall) => toolCall.name === 'create_or_update_file');
    if (!call) {
      return null;
    }

    const args = call.args as Record<string, unknown>;
    const owner = this.readString(args.owner) ?? this.repository?.owner;
    const repo = this.readString(args.repo) ?? this.repository?.repo;
    const path = this.readString(args.path) ?? this.repository?.path ?? README_PATH;
    const content = this.readString(args.content);
    const message = this.readString(args.message);
    const branch = this.readString(args.branch) ?? this.repository?.branch;

    if (!owner || !repo || !content || !message || !branch) {
      return null;
    }

    return {
      owner,
      repo,
      path,
      branch,
      content,
      message,
    };
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }
}
