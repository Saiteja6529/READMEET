import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  FileEdit,
  FilePlus,
  Github,
  Loader2,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useGitHubChat, WorkflowStep } from '../hooks/useGitHubChat';
import { ChatMessage, WorkflowMode } from '../services/GitHubModel';

export const GitHubManager: React.FC = () => {
  const chat = useGitHubChat();
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, chat.isLoading]);

  const handleStartCreate = async () => {
    await chat.startCreateMode(owner, repo, branch);
  };

  const handleStartUpdate = async () => {
    await chat.startUpdateMode(owner, repo, branch);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedValue = inputValue.trim();
    if (!trimmedValue || chat.isLoading) {
      return;
    }

    setInputValue('');
    await chat.sendUserMessage(trimmedValue);
  };

  const disableWorkflowStart = chat.isLoading || !owner.trim() || !repo.trim() || !branch.trim();
  const title =
    chat.mode === WorkflowMode.CREATE ? 'Create README Interview' : 'Update README Interview';

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden border-b border-slate-200 bg-slate-950 px-6 py-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.35),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.25),_transparent_30%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              <Sparkles className="h-3.5 w-3.5" />
              GitHub Agentic Workspace
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Github className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  AI README creation and editing
                </h2>
                <p className="max-w-2xl text-sm text-slate-300">
                  Start a guided interview for a new README, or let the AI read the existing
                  README first and propose updates before anything is published.
                </p>
              </div>
            </div>
          </div>

          {chat.step !== WorkflowStep.IDLE && (
            <button
              type="button"
              onClick={chat.cancel}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 bg-slate-50 p-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Repository Target
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Choose where README.md goes</h3>
            <p className="mt-1 text-sm text-slate-600">
              The same repo details are used for both the interview and the final GitHub publish.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Owner</span>
              <input
                type="text"
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
                placeholder="octocat"
                disabled={chat.step !== WorkflowStep.IDLE || chat.isLoading}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Repository</span>
              <input
                type="text"
                value={repo}
                onChange={(event) => setRepo(event.target.value)}
                placeholder="hello-world"
                disabled={chat.step !== WorkflowStep.IDLE || chat.isLoading}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Branch</span>
              <input
                type="text"
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                placeholder="main"
                disabled={chat.step !== WorkflowStep.IDLE || chat.isLoading}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={handleStartCreate}
              disabled={disableWorkflowStart}
              className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-left transition hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-600 p-2.5 text-white">
                  <FilePlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Create README</p>
                  <p className="text-sm text-slate-600">Interview first, no initial tool usage.</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleStartUpdate}
              disabled={disableWorkflowStart}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left transition hover:border-emerald-400 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-600 p-2.5 text-white">
                  <FileEdit className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Update README</p>
                  <p className="text-sm text-slate-600">Reads `README.md` before asking what to change.</p>
                </div>
              </div>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Session Status
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                Step:{' '}
                <span className="font-medium text-slate-900">
                  {chat.step === WorkflowStep.IDLE ? 'Ready' : chat.step}
                </span>
              </p>
              <p>
                Mode:{' '}
                <span className="font-medium text-slate-900">{chat.mode ?? 'Not selected'}</span>
              </p>
              <p>
                Repo:{' '}
                <span className="font-medium text-slate-900">
                  {chat.repository
                    ? `${chat.repository.owner}/${chat.repository.repo}`
                    : 'Choose a repo'}
                </span>
              </p>
              <p>
                Branch:{' '}
                <span className="font-medium text-slate-900">
                  {chat.repository ? chat.repository.branch : branch || 'main'}
                </span>
              </p>
            </div>
          </div>

          {chat.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {chat.error}
            </div>
          )}
        </aside>

        <div className="min-h-[620px] rounded-[24px] border border-slate-200 bg-white shadow-sm">
          {chat.step === WorkflowStep.IDLE && (
            <div className="flex h-full min-h-[620px] items-center justify-center p-8">
              <div className="max-w-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg">
                  <Bot className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
                  README workspace is ready
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Enter the GitHub owner and repository, then choose whether you want to create a
                  README from scratch or update the current one through the AI interview flow.
                </p>
              </div>
            </div>
          )}

          {chat.step === WorkflowStep.CHATTING && (
            <div className="flex h-full min-h-[620px] flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-500">
                    {chat.repository
                      ? `${chat.repository.owner}/${chat.repository.repo}/README.md`
                      : 'README.md'}
                  </p>
                </div>
                {chat.isLoading && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI is thinking
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-6 py-6">
                {chat.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {chat.isLoading && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-3 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Working on the next step...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-6 py-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="Answer the AI or describe the README change you want..."
                    disabled={chat.isLoading}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={chat.isLoading || !inputValue.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          )}

          {chat.step === WorkflowStep.PREVIEW && chat.previewDraft && (
            <div className="flex h-full min-h-[620px] flex-col">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    Preview
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">
                    Review the generated Markdown before publishing
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{chat.previewDraft.message}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={chat.goBackToChat}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to chat
                  </button>
                  <button
                    type="button"
                    onClick={chat.confirmPublish}
                    disabled={chat.isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {chat.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publishing
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm & Publish
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid flex-1 gap-6 p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Destination
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {chat.previewDraft.owner}/{chat.previewDraft.repo}
                    </p>
                    <p className="text-sm text-slate-600">{chat.previewDraft.path}</p>
                    <p className="text-sm text-slate-600">Branch: {chat.previewDraft.branch}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Commit Message
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{chat.previewDraft.message}</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-inner">
                  <div className="border-b border-white/10 px-5 py-3 text-sm font-medium text-slate-300">
                    README.md
                  </div>
                  <pre className="h-full overflow-auto p-5 text-sm leading-7 text-slate-100">
                    <code>{chat.previewDraft.content}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {chat.step === WorkflowStep.SUCCESS && (
            <div className="flex h-full min-h-[620px] items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
                  README published
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  The draft was confirmed and sent through the GitHub MCP proxy. Start a new
                  session when you want to work on another repository.
                </p>
                <button
                  type="button"
                  onClick={chat.cancel}
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Start another session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-3xl px-5 py-4 shadow-sm ${
          isUser
            ? 'rounded-br-md bg-slate-950 text-white'
            : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
        }`}
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
      </div>
    </div>
  );
};
