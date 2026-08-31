import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowRight, Check, Compass, Lightbulb, LoaderCircle, MessageCircle, RotateCcw, Search, Sparkles, Users, X } from 'lucide-react';
import { useFindHobbyMatches } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [interests, setInterests] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [response, setResponse] = useState<{
    matches: Array<{ groupName: string; reason: string; icebreaker: string }>;
    fallback: boolean;
    message: string;
  } | null>(null);
  const [submittedInterest, setSubmittedInterest] = useState('');
  const [showExamples, setShowExamples] = useState(true);
  const matchMutation = useFindHobbyMatches();
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }, [status]);

  const examples = ['film photography', 'street food', 'women’s football', 'making music'];
  const trimmedInterests = interests.trim();
  const tooShort = trimmedInterests.length > 0 && trimmedInterests.length < 3;
  const mutationError = matchMutation.error as unknown;
  const errorMessage = mutationError instanceof Error
    ? mutationError.message
    : typeof mutationError === 'object' && mutationError !== null && 'error' in mutationError && typeof (mutationError as { error?: unknown }).error === 'string'
      ? (mutationError as { error: string }).error
      : 'We could not reach the matching desk just now.';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmedInterests.length < 3) {
      setStatus('idle');
      setShowExamples(false);
      return;
    }

    setStatus('loading');
    setResponse(null);
    setSubmittedInterest(trimmedInterests);
    matchMutation.reset();
    matchMutation.mutate(
      { data: { interests: trimmedInterests } },
      {
        onSuccess: (data) => {
          setResponse(data);
          setStatus('success');
        },
        onError: () => {
          setStatus('error');
        },
      },
    );
  }

  function handleTryAgain() {
    setStatus('idle');
    setResponse(null);
    setShowExamples(true);
    document.getElementById('interest-input')?.focus();
  }

  function addExample(example: string) {
    setInterests((current) => current ? `${current}, ${example}` : example);
    setShowExamples(false);
    document.getElementById('interest-input')?.focus();
  }

  const isLoading = status === 'loading' || matchMutation.isPending;

  return (
    <main className="grain min-h-[100dvh] overflow-hidden bg-[#f6f8fb]">
      <div className="relative mx-auto min-h-[100dvh] max-w-[1440px] px-5 pb-16 pt-5 sm:px-8 sm:pt-8 lg:px-12">
        <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full border border-[#b7d7e7] opacity-60 sm:-right-8 sm:top-32" />
        <div className="pointer-events-none absolute -right-10 top-44 h-52 w-52 rounded-full border border-dashed border-[#d5a18d] opacity-40 sm:right-20" />
        <div className="pointer-events-none absolute left-[42%] top-16 hidden h-3 w-3 rounded-full bg-[#ef987c] opacity-80 sm:block" />
        <div className="pointer-events-none absolute bottom-32 left-[-4rem] h-72 w-72 rounded-full bg-[#dff1f4] opacity-70 blur-3xl" />

        <header className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#152b59] text-[#a8e3eb] shadow-[0_8px_20px_rgba(21,43,89,.17)]" aria-hidden="true">
              <Compass className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <div className="wordmark text-[1.15rem] font-bold leading-none text-[#152b59]">aatmoday</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#71809a]">campus, together</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#d8e1ea] bg-white/60 px-3 py-2 text-xs font-semibold text-[#5d6c84] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#68b9ac]" />
            Made for finding your people
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#71809a] sm:hidden">
            <Users className="h-3.5 w-3.5" />
            Your campus, warmer
          </div>
        </header>

        <section className="relative z-10 mx-auto grid max-w-6xl gap-12 pb-12 pt-16 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:gap-20 lg:pb-20 lg:pt-28">
          <div className="animate-rise-in">
            <div className="mono-label mb-5 flex items-center gap-2 text-[11px] font-medium text-[#4b83a1]">
              <span className="h-px w-7 bg-[#75b9c7]" />
              the first step is small
            </div>
            <h1 className="max-w-3xl text-[clamp(3.25rem,8vw,6.7rem)] font-semibold leading-[.91] tracking-[-.075em] text-[#152b59]">
              Find a hobby.<br />
              <span className="relative inline-block text-[#3f79a0]">
                Find your people.
                <svg className="absolute -bottom-3 left-0 h-4 w-full overflow-visible" viewBox="0 0 410 14" fill="none" aria-hidden="true">
                  <path d="M2 8.5C93 1.5 253 1 407 7" stroke="#e99a7f" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-8 max-w-lg text-[1.05rem] leading-7 text-[#5f6f87] sm:text-lg">
              Tell us what makes you curious. We’ll point you toward campus groups that feel like a good next hello.
            </p>

            <form onSubmit={handleSubmit} className="mt-9 max-w-2xl" noValidate>
              <label htmlFor="interest-input" className="mono-label mb-3 block text-[10px] font-medium text-[#71809a]">
                What are you into lately?
              </label>
              <div className={`relative rounded-[22px] border bg-white p-2 shadow-[0_16px_36px_rgba(30,54,91,.08)] transition-all duration-300 ${tooShort ? 'border-[#e99a7f] ring-4 ring-[#e99a7f]/10' : 'border-[#cedbe6] focus-within:border-[#6db5c4] focus-within:ring-4 focus-within:ring-[#a8e3eb]/30'}`}>
                <textarea
                  id="interest-input"
                  value={interests}
                  onChange={(event) => {
                    setInterests(event.target.value.slice(0, 800));
                    if (status !== 'idle') {
                      setStatus('idle');
                      setResponse(null);
                    }
                  }}
                  placeholder="e.g. I like sketching, trying new recipes, and live music..."
                  rows={3}
                  maxLength={800}
                  aria-describedby="interest-help"
                  data-testid="input-interests"
                  className="input-caret focus-ring min-h-[76px] w-full resize-none border-0 bg-transparent px-3 py-2 text-base leading-6 text-[#152b59] outline-none placeholder:text-[#9aaabd]"
                />
                <div className="flex items-center justify-between border-t border-[#edf1f5] px-3 pt-2">
                  <span id="interest-help" className={`text-xs ${tooShort ? 'font-semibold text-[#c26f59]' : 'text-[#8b99ab]'}`}>
                    {tooShort ? 'A little more detail helps us get the vibe.' : `${trimmedInterests.length}/800`}
                  </span>
                  <button
                    type="submit"
                    disabled={isLoading}
                    data-testid="button-find-match"
                    className="focus-ring group flex min-h-11 items-center gap-2 rounded-[14px] bg-[#152b59] px-4 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#23447e] hover:shadow-[0_8px_18px_rgba(21,43,89,.2)] active:translate-y-0 disabled:cursor-wait disabled:opacity-80"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Looking around...
                      </>
                    ) : (
                      <>
                        Find my match
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {showExamples && status === 'idle' && (
              <div className="mt-4 flex flex-wrap items-center gap-2 animate-rise-in animation-delay-100">
                <span className="mr-1 text-xs font-medium text-[#8492a5]">Try</span>
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => addExample(example)}
                    data-testid={`button-example-${example.replaceAll(' ', '-')}`}
                    className="focus-ring rounded-full border border-[#d3e1e9] bg-white/65 px-3 py-1.5 text-xs font-semibold text-[#51738e] transition-colors hover:border-[#80bfca] hover:bg-[#e8f5f6] hover:text-[#24516e]"
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="relative mx-auto w-full max-w-[360px] animate-rise-in animation-delay-200 lg:mx-0">
            <div className="absolute -left-7 -top-8 z-10 hidden h-14 w-14 rotate-[-14deg] rounded-[13px] border border-[#d7a08b] bg-[#f9d8ca] shadow-[0_8px_14px_rgba(120,77,63,.1)] sm:block">
              <div className="mx-auto mt-3 h-6 w-6 rounded-full border-2 border-[#a96755]" />
              <div className="mx-auto mt-1 h-1 w-5 rounded-full bg-[#a96755]" />
            </div>
            <div className="relative overflow-hidden rounded-[30px] bg-[#152b59] p-6 text-white shadow-[0_24px_50px_rgba(21,43,89,.19)] sm:p-7">
              <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full border border-[#5a78ad]/40" />
              <div className="absolute -right-4 top-8 h-28 w-28 rounded-full border border-dashed border-[#75b9c7]/50" />
              <div className="relative">
                <div className="mb-12 flex items-center justify-between">
                  <span className="mono-label text-[10px] text-[#a8e3eb]">a little nudge</span>
                  <Sparkles className="h-4 w-4 text-[#a8e3eb]" />
                </div>
                <p className="max-w-[240px] text-[1.65rem] font-semibold leading-[1.08] tracking-[-.045em]">
                  You don’t need a perfect plan to start.
                </p>
                <div className="mt-7 flex items-center gap-3 border-t border-[#ffffff1c] pt-5 text-xs leading-5 text-[#c5d4ea]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#31528a]">
                    <MessageCircle className="h-4 w-4 text-[#a8e3eb]" />
                  </div>
                  <span>One shared interest is enough for a first conversation.</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-4 flex -rotate-3 items-center gap-2 rounded-xl border border-[#d9e4ec] bg-white px-3 py-2 text-xs font-semibold text-[#59718b] shadow-[0_8px_18px_rgba(30,54,91,.09)] sm:-right-8">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8f5f6] text-[#3e8395]"><Check className="h-3.5 w-3.5" /></span>
              no awkward cold start
            </div>
          </aside>
        </section>

        <section ref={resultsRef} aria-live="polite" className="relative z-10 mx-auto max-w-6xl scroll-mt-5">
          {isLoading && <LoadingState />}
          {status === 'error' && <ErrorState message={errorMessage} onTryAgain={handleTryAgain} />}
          {status === 'success' && response && (
            <ResultsState response={response} submittedInterest={submittedInterest} onStartOver={handleTryAgain} />
          )}
        </section>

        <footer className="relative z-10 mx-auto mt-20 flex max-w-6xl flex-col gap-3 border-t border-[#dce5ec] pt-5 text-xs text-[#8593a5] sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium">Aatmoday is a gentle starting point, not a personality test.</span>
          <span className="mono-label text-[9px] tracking-[.14em]">made for campus life</span>
        </footer>
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="animate-rise-in rounded-[28px] border border-[#d5e1ea] bg-white/85 p-5 shadow-[0_14px_34px_rgba(30,54,91,.06)] sm:p-8" data-testid="status-loading">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f5f6] text-[#3f8194]">
          <Search className="h-5 w-5 animate-pulse" />
        </div>
        <div className="w-full">
          <p className="mono-label text-[10px] font-medium text-[#4b83a1]">checking the campus map</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em] text-[#152b59]">Finding a good first hello...</h2>
          <p className="mt-2 text-sm text-[#74849a]">We’re looking for groups where your interests can do the introducing.</p>
        </div>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className="loading-sheen h-28 rounded-2xl" />
        <div className="loading-sheen h-28 rounded-2xl" />
      </div>
    </div>
  );
}

function ErrorState({ message, onTryAgain }: { message: string; onTryAgain: () => void }) {
  return (
    <div className="animate-rise-in rounded-[28px] border border-[#e8c8bd] bg-[#fffaf7] p-6 shadow-[0_14px_34px_rgba(113,70,57,.06)] sm:p-8" data-testid="status-error">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f9dfd4] text-[#bf6e55]">
            <X className="h-5 w-5" />
          </div>
          <div>
            <p className="mono-label text-[10px] font-medium text-[#ba765e]">a small detour</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em] text-[#613e39]">The matching desk is taking a breather.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#806763]">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onTryAgain}
          data-testid="button-try-again"
          className="focus-ring flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#dfb7aa] bg-white px-4 text-sm font-bold text-[#8d5648] transition-all hover:border-[#c98b79] hover:bg-[#fff4ef]"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}

function ResultsState({
  response,
  submittedInterest,
  onStartOver,
}: {
  response: { matches: Array<{ groupName: string; reason: string; icebreaker: string }>; fallback: boolean; message: string };
  submittedInterest: string;
  onStartOver: () => void;
}) {
  if (!response.matches.length) {
    return (
      <div className="animate-rise-in rounded-[28px] border border-[#d5e1ea] bg-white/90 p-6 shadow-[0_14px_34px_rgba(30,54,91,.06)] sm:p-8" data-testid="status-empty">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 rotate-[-5deg] items-center justify-center rounded-[18px] bg-[#e8f5f6] text-[#3f8194]">
            <Compass className="h-6 w-6" />
          </div>
          <p className="mono-label mt-5 text-[10px] font-medium text-[#4b83a1]">not quite yet</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-.05em] text-[#152b59]">We need one more clue.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#71809a]">{response.message || 'Try adding a specific activity, genre, or thing you have been curious about.'}</p>
          <button type="button" onClick={onStartOver} data-testid="button-refine-interests" className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#152b59] px-4 text-sm font-bold text-white transition-all hover:bg-[#23447e]">
            Refine my interests <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise-in" data-testid="status-results">
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono-label text-[10px] font-medium text-[#4b83a1]">your little campus shortlist</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-.06em] text-[#152b59] sm:text-4xl">You might click with these.</h2>
          <p className="mt-2 text-sm text-[#71809a]">{response.message || `A few places to start from “${submittedInterest}”.`}</p>
        </div>
        <button type="button" onClick={onStartOver} data-testid="button-start-over" className="focus-ring inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-[#cbdbe5] bg-white px-3.5 text-sm font-bold text-[#4f6c85] transition-colors hover:border-[#80bfca] hover:bg-[#edf8f8] sm:self-auto">
          <RotateCcw className="h-3.5 w-3.5" />
          Start over
        </button>
      </div>

      {response.fallback && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#e5d6b1] bg-[#fff9e9] px-4 py-3.5 text-sm text-[#806b3c]" data-testid="status-fallback">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#c6973e]" />
          <span>{response.message || 'These are welcoming groups with a little room for a new direction.'}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {response.matches.map((match, index) => (
          <article
            key={`${match.groupName}-${index}`}
            className={`group relative overflow-hidden rounded-[24px] border border-[#d4e0e9] bg-white p-5 shadow-[0_10px_25px_rgba(30,54,91,.055)] transition-all duration-300 hover:-translate-y-1 hover:border-[#9cc8d1] hover:shadow-[0_18px_34px_rgba(30,54,91,.1)] sm:p-6 ${index % 2 ? 'animate-rise-in animation-delay-100' : 'animate-rise-in'}`}
            data-testid={`card-match-${index}`}
          >
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full border border-[#e0edf0] transition-transform duration-500 group-hover:translate-x-5 group-hover:-translate-y-5" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#e8f5f6] text-sm font-bold text-[#3f8194]">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <p className="mono-label text-[9px] font-medium text-[#7790a4]">possible match</p>
              </div>
              <div className="rounded-full bg-[#f2f6fa] px-2.5 py-1 text-[10px] font-bold text-[#66809a]">on campus</div>
            </div>
            <h3 className="relative mt-5 text-[1.55rem] font-semibold leading-tight tracking-[-.05em] text-[#152b59]" data-testid={`text-group-name-${index}`}>{match.groupName}</h3>
            <div className="relative mt-5 border-t border-[#edf1f5] pt-4">
              <p className="text-sm leading-6 text-[#60738b]" data-testid={`text-match-reason-${index}`}>{match.reason}</p>
            </div>
            <div className="relative mt-5 rounded-2xl bg-[#f4f8fa] p-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#4b83a1]">
                <MessageCircle className="h-3.5 w-3.5" />
                Easy opener
              </div>
              <p className="mt-2 text-sm font-semibold leading-5 text-[#2c4b69]" data-testid={`text-icebreaker-${index}`}>“{match.icebreaker}”</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
