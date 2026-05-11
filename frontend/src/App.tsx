import { Zap } from 'lucide-react';
import { AgentFeed } from './components/AgentFeed';
import { InputForm } from './components/InputForm';
import { ResultsPanel } from './components/ResultsPanel';
import { useAuth } from './hooks/useAuth';
import { useOutreach } from './hooks/useOutreach';

function App() {
  const { user, sessionToken, login, logout } = useAuth();
  const {
    generate,
    isStarting,
    startError,
    events,
    result,
    isStreaming,
    sseError,
  } = useOutreach();

  const isWorking = isStarting || isStreaming;
  const hasStarted = events.length > 0 || isStarting;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-[#2563EB] opacity-[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-[#8B5CF6] opacity-[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-[var(--color-border-subtle)]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg animated-gradient flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">OutreachAI</span>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{user.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
              </div>
              {user.picture && (
                <img src={user.picture} alt="" className="w-8 h-8 rounded-full ring-2 ring-[var(--color-border-subtle)]" />
              )}
              <button
                onClick={logout}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer ml-1"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white/10 text-white hover:bg-white/15 transition-all cursor-pointer border border-white/10"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Hero — only show when no results */}
        {!result && !hasStarted && (
          <div className="text-center pt-20 pb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary-light)] text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)] pulse-dot" />
              Powered by AI Agents
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] glow-text">
              Find the right person.
              <br />
              <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                Write the perfect email.
              </span>
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg mt-5 max-w-xl mx-auto leading-relaxed">
              Four AI agents research the company, find the contact, match your
              background, and draft personalized outreach — in under 60 seconds.
            </p>
          </div>
        )}

        {/* Compact header when working */}
        {!result && hasStarted && (
          <div className="pt-10 pb-6" />
        )}

        {/* Input Form */}
        {!result && (
          <div className="mb-10">
            <InputForm onSubmit={generate} isLoading={isWorking} />
          </div>
        )}

        {/* Errors */}
        {(startError || sseError) && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {startError || sseError}
          </div>
        )}

        {/* Agent Feed */}
        {hasStarted && !result && (
          <div className="mb-10">
            <AgentFeed events={events} isStreaming={isStreaming} />
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="py-10">
            {/* Sign in prompt */}
            {!user && (
              <div className="mb-8 p-5 rounded-xl gradient-border bg-[var(--color-surface-raised)] flex items-center justify-between gap-4">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Sign in with Google to send emails directly from your Gmail.
                </p>
                <button
                  onClick={login}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
                >
                  Sign in with Google
                </button>
              </div>
            )}

            {/* Agent feed collapsed */}
            <details className="mb-8">
              <summary className="text-sm text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text-secondary)] transition-colors">
                View agent activity ({events.length} events)
              </summary>
              <div className="mt-3">
                <AgentFeed events={events} isStreaming={false} />
              </div>
            </details>

            <ResultsPanel
              result={result}
              sessionToken={sessionToken}
              isLoggedIn={!!user}
              onLoginRequired={login}
            />

            <button
              onClick={() => window.location.reload()}
              className="mt-10 w-full py-3.5 px-4 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-medium rounded-xl transition-all cursor-pointer"
            >
              Start New Outreach
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="py-10 text-center text-xs text-[var(--color-text-muted)]">
          Built with Groq, Tavily, and Apollo
        </div>
      </div>
    </div>
  );
}

export default App;
