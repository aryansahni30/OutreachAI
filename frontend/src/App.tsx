import { AgentFeed } from './components/AgentFeed';
import { InputForm } from './components/InputForm';
import { ResultsPanel } from './components/ResultsPanel';
import { useOutreach } from './hooks/useOutreach';

function App() {
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
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Cold Reach</h1>
          <p className="text-zinc-400 mt-2">
            AI agents that find the right person and write the perfect email.
          </p>
        </div>

        {/* Input Form — hide after results */}
        {!result && (
          <div className="mb-8">
            <InputForm onSubmit={generate} isLoading={isWorking} />
          </div>
        )}

        {/* Errors */}
        {(startError || sseError) && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {startError || sseError}
          </div>
        )}

        {/* Agent Feed — show while working */}
        {hasStarted && !result && (
          <div className="mb-8">
            <AgentFeed events={events} isStreaming={isStreaming} />
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Show agent feed collapsed */}
            <details className="mb-6">
              <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-300">
                View agent activity ({events.length} events)
              </summary>
              <div className="mt-2">
                <AgentFeed events={events} isStreaming={false} />
              </div>
            </details>

            <ResultsPanel result={result} />

            {/* Start Over */}
            <button
              onClick={() => window.location.reload()}
              className="mt-8 w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors cursor-pointer"
            >
              Start New Outreach
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
