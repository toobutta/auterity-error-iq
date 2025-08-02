import React, { Suspense, lazy } from 'react';

// Dynamically import syntax highlighter with style bundled together
const SyntaxHighlighterWithStyle = lazy(() => 
  Promise.all([
    import('react-syntax-highlighter/dist/esm/languages/prism/javascript'),
    import('react-syntax-highlighter/dist/esm/languages/prism/json'),
    import('react-syntax-highlighter/dist/esm/languages/prism/markup'),
    import('react-syntax-highlighter/dist/esm/styles/prism/dark')
  ]).then(([jsLang, jsonLang, markupLang, { default: darkStyle }]) => {
    // Import the main Prism component
    return import('react-syntax-highlighter/dist/esm/prism-light').then(({ default: SyntaxHighlighter }) => {
      try {
        // Register languages
        SyntaxHighlighter.registerLanguage('javascript', jsLang.default);
        SyntaxHighlighter.registerLanguage('json', jsonLang.default);
        SyntaxHighlighter.registerLanguage('text', markupLang.default);
        SyntaxHighlighter.registerLanguage('markup', markupLang.default);
        
        return {
          default: ({ language, children, className, showLineNumbers }: LazyCodeHighlighterProps) => (
            <SyntaxHighlighter
              language={language === 'text' ? 'markup' : language}
              style={darkStyle}
              className={className}
              showLineNumbers={showLineNumbers}
            >
              {children}
            </SyntaxHighlighter>
          )
        };
      } catch (error) {
        console.error('Failed to register syntax highlighter languages', {
          component: 'LazyCodeHighlighter',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    });
  }).catch(error => {
    console.error('Failed to load syntax highlighter modules', {
      component: 'LazyCodeHighlighter',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  })
);

interface LazyCodeHighlighterProps {
  language: string;
  children: string;
  className?: string;
  showLineNumbers?: boolean;
}

const LoadingFallback: React.FC<{ children: string }> = ({ children }) => (
  <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
    <div className="flex items-center mb-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      <span className="text-xs text-gray-400">Loading syntax highlighter...</span>
    </div>
    <pre className="whitespace-pre-wrap">{children}</pre>
  </div>
);

const ErrorFallback: React.FC<{ children: string }> = ({ children }) => (
  <div className="bg-gray-100 border border-gray-300 p-4 rounded">
    <div className="text-red-600 text-sm mb-2">
      Failed to load syntax highlighter
    </div>
    <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm overflow-x-auto">
      {children}
    </pre>
  </div>
);

class SyntaxHighlighterErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ children: string }>; code: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ComponentType<{ children: string }>; code: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with comprehensive context for debugging
    console.error('SyntaxHighlighter error boundary triggered', {
      component: 'LazyCodeHighlighter',
      timestamp: new Date().toISOString(),
      action: 'fallback_rendered',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent>{this.props.code}</FallbackComponent>;
    }

    return this.props.children;
  }
}

export const LazyCodeHighlighter: React.FC<LazyCodeHighlighterProps> = ({
  language,
  children,
  className = '',
  showLineNumbers = false
}) => {
  return (
    <SyntaxHighlighterErrorBoundary fallback={ErrorFallback} code={children}>
      <Suspense fallback={<LoadingFallback>{children}</LoadingFallback>}>
        <SyntaxHighlighterWithStyle
          language={language}
          className={className}
          showLineNumbers={showLineNumbers}
        >
          {children}
        </SyntaxHighlighterWithStyle>
      </Suspense>
    </SyntaxHighlighterErrorBoundary>
  );
};

export default LazyCodeHighlighter;