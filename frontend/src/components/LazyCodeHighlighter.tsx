import React, { Suspense, lazy } from 'react';

// Security: Sanitize input to prevent XSS attacks
const sanitizeCode = (code: string): string => {
  if (typeof code !== 'string') {
    return '';
  }
  // Remove potentially dangerous HTML tags and scripts
  return code
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
};

// Security: Validate language parameter
const validateLanguage = (language: string): string => {
  const allowedLanguages = [
    'javascript',
    'json',
    'markup',
    'text',
    'html',
    'css',
    'python',
    'bash',
  ];
  return allowedLanguages.includes(language.toLowerCase()) ? language.toLowerCase() : 'text';
};

// Dynamically import syntax highlighter with style bundled together
const SyntaxHighlighterWithStyle = lazy(() =>
  Promise.all([
    import('react-syntax-highlighter/dist/esm/languages/prism/javascript'),
    import('react-syntax-highlighter/dist/esm/languages/prism/json'),
    import('react-syntax-highlighter/dist/esm/languages/prism/markup'),
    import('react-syntax-highlighter/dist/esm/styles/prism/dark'),
  ])
    .then(([jsLang, jsonLang, markupLang, { default: darkStyle }]) => {
      // Import the main Prism component
      return import('react-syntax-highlighter/dist/esm/prism-light').then(
        ({ default: SyntaxHighlighter }) => {
          try {
            // Register languages
            SyntaxHighlighter.registerLanguage('javascript', jsLang.default);
            SyntaxHighlighter.registerLanguage('json', jsonLang.default);
            SyntaxHighlighter.registerLanguage('text', markupLang.default);
            SyntaxHighlighter.registerLanguage('markup', markupLang.default);

            return {
              default: ({
                language,
                children,
                className,
                showLineNumbers,
              }: LazyCodeHighlighterProps) => {
                const sanitizedCode = sanitizeCode(children);
                const validatedLanguage = validateLanguage(language);

                return (
                  <SyntaxHighlighter
                    language={validatedLanguage === 'text' ? 'markup' : validatedLanguage}
                    style={darkStyle}
                    className={className}
                    showLineNumbers={showLineNumbers}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: '#1a1a1a',
                    }}
                  >
                    {sanitizedCode}
                  </SyntaxHighlighter>
                );
              },
            };
          } catch (error) {
            console.error('Failed to register syntax highlighter languages', {
              component: 'LazyCodeHighlighter',
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
          }
        }
      );
    })
    .catch((error) => {
      console.error('Failed to load syntax highlighter modules', {
        component: 'LazyCodeHighlighter',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
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

const LoadingFallback: React.FC<{ children: string }> = ({ children }) => {
  const sanitizedCode = sanitizeCode(children);
  return (
    <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
      <div className="flex items-center mb-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        <span className="text-xs text-gray-400">Loading syntax highlighter...</span>
      </div>
      <pre className="whitespace-pre-wrap">{sanitizedCode}</pre>
    </div>
  );
};

const ErrorFallback: React.FC<{ children: string }> = ({ children }) => {
  const sanitizedCode = sanitizeCode(children);
  return (
    <div className="bg-gray-100 border border-gray-300 p-4 rounded">
      <div className="text-red-600 text-sm mb-2">Failed to load syntax highlighter</div>
      <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm overflow-x-auto">
        {sanitizedCode}
      </pre>
    </div>
  );
};

class SyntaxHighlighterErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ children: string }>; code: string },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback: React.ComponentType<{ children: string }>;
    code: string;
  }) {
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
      componentStack: errorInfo.componentStack,
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
  showLineNumbers = false,
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
