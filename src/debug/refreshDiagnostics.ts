export function setupRefreshDiagnostics(): void {
  if (!import.meta.env.DEV) return;

  const KEY = '__topology_boot_count__';
  const bootCount = Number(sessionStorage.getItem(KEY) || '0') + 1;
  sessionStorage.setItem(KEY, String(bootCount));

  const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  const navType = navEntries[0]?.type ?? 'unknown';

  const now = new Date().toISOString();
  console.groupCollapsed(`[diag] app boot #${bootCount}`);
  console.log('time', now);
  console.log('navigationType', navType);
  console.log('href', window.location.href);
  console.log('visibility', document.visibilityState);
  console.groupEnd();

  window.addEventListener('beforeunload', () => {
    console.log('[diag] beforeunload fired -> full page navigation/reload is happening');
  });

  window.addEventListener('error', (event) => {
    console.error('[diag] runtime error', event.message, event.filename, event.lineno, event.colno);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[diag] unhandled promise rejection', event.reason);
  });

  document.addEventListener('visibilitychange', () => {
    console.log('[diag] visibilitychange', document.visibilityState);
  });

  window.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const label = target?.tagName ?? 'unknown';
    console.log('[diag] click', label, 'at', window.location.pathname);
  }, true);

  if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => {
      console.log('[diag] HMR update incoming');
    });
    import.meta.hot.on('vite:afterUpdate', () => {
      console.log('[diag] HMR update applied');
    });
    import.meta.hot.on('vite:invalidate', (payload) => {
      console.warn('[diag] HMR invalidate', payload);
    });
  }
}
