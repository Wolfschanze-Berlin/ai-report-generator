'use client';

import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import type { MarkdownComponent as MarkdownComponentType } from '@/types/report-schema';
import 'highlight.js/styles/github-dark.css';

interface MarkdownComponentProps {
  component: MarkdownComponentType;
}

export function MarkdownComponent({ component }: MarkdownComponentProps) {
  const { content, style = 'default' } = component.data;

  // Style variants
  const styleClasses = {
    default: 'prose prose-sm dark:prose-invert max-w-none',
    card: 'prose prose-sm dark:prose-invert max-w-none bg-card/50 p-6 rounded-lg border border-border',
    highlight: 'prose prose-sm dark:prose-invert max-w-none bg-accent/10 p-6 rounded-lg border-l-4 border-accent',
  };

  return (
    <div className="w-full h-full overflow-auto p-4">
      <div className={styleClasses[style]}>
        <ReactMarkdown
          rehypePlugins={[rehypeSanitize, rehypeHighlight]}
          components={{
            // Custom link handling
            a: ({ node, ...props }) => (
              <a
                {...props}
                target={props.href?.startsWith('http') ? '_blank' : undefined}
                rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-primary hover:underline"
              />
            ),
            // Custom code block styling
            code: ({ node, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <code className={className} {...props}>
                  {children}
                </code>
              ) : (
                <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            },
            // Custom heading styling
            h1: ({ node, ...props }) => (
              <h1 className="text-2xl font-bold mb-4 text-foreground" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-xl font-semibold mb-3 text-foreground" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-lg font-medium mb-2 text-foreground" {...props} />
            ),
            // Custom list styling
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside space-y-1 text-foreground" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside space-y-1 text-foreground" {...props} />
            ),
            // Custom paragraph styling
            p: ({ node, ...props }) => (
              <p className="mb-4 text-foreground leading-relaxed" {...props} />
            ),
            // Custom blockquote styling
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4"
                {...props}
              />
            ),
            // Custom table styling
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-border" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-muted" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="px-4 py-2 text-left border border-border font-semibold" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-4 py-2 border border-border" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
