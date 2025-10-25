import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup";
import "prismjs/themes/prism-tomorrow.css";
import React from "react";

// Security: Sanitize input to prevent XSS attacks
const sanitizeCode = (code: string): string => {
  if (typeof code !== "string") {
    return "";
  }
  // Remove potentially dangerous HTML tags and scripts
  return code
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "");
};

// Security: Validate language parameter
const validateLanguage = (language: string): string => {
  const allowedLanguages = [
    "javascript",
    "json",
    "markup",
    "text",
    "html",
    "css",
    "python",
    "bash",
  ];
  return allowedLanguages.includes(language.toLowerCase())
    ? language.toLowerCase()
    : "text";
};

interface LazyCodeHighlighterProps {
  language: string;
  children: string;
  className?: string;
  showLineNumbers?: boolean;
}

export const LazyCodeHighlighter: React.FC<LazyCodeHighlighterProps> = ({
  language,
  children,
  className = "",
}) => {
  const validatedLanguage = validateLanguage(language);
  const sanitizedCode = sanitizeCode(children);
  const grammar = Prism.languages[validatedLanguage] || Prism.languages.markup;
  const highlighted = Prism.highlight(sanitizedCode, grammar, validatedLanguage);
  return (
    <pre className={`bg-[#1a1a1a] text-sm p-4 rounded overflow-x-auto font-mono ${className}`}>
      <code
        className={`language-${validatedLanguage}`}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </pre>
  );
};

export default LazyCodeHighlighter;


