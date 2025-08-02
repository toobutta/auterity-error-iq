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
    });
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

const ErrorFallback: React.FC<{ children: string; error?: Error }> = ({ children, error }) => (
  <div className="bg-gray-100 border border-gray-300 p-4 rounded">
    <div className="text-red-600 text-sm mb-2">
      Failed to load syntax highlighter: {error?.message || 'Unknown error'}
    </div>
    <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm overflow-x-auto">
      {children}
    </pre>
  </div>
);

class SyntaxHighlighterErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ children: string; error?: Error }>; code: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Syntax highlighter error:', { message: error.message, stack: error.stack?.substring(0, 500) });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent children={this.props.code} error={this.state.error} />;
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