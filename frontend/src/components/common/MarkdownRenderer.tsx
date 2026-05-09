import { useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { mainBkg: '#f0fdf4', nodeBorder: '#166534', clusterBkg: '#f0f9ff', clusterBorder: '#1e40af', edgeLabelBackground: '#ffffff', lineColor: '#6b7280', textColor: '#111827', fontSize: '14px' }, securityLevel: 'strict' });

let mermaidCounter = 0;

function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!containerRef.current) return;
      const id = `mermaid-${++mermaidCounter}`;
      try {
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = DOMPurify.sanitize(svg);
        }
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.textContent = code;
        }
      }
    };
    render();
    return () => { cancelled = true; };
  }, [code]);

  return <div ref={containerRef} className="flex justify-center my-4 overflow-x-auto" />;
}

export default function MarkdownRenderer({ content }: { content: string }) {
  const handleCodeBlock = useCallback(({ className, children, ...rest }: React.ComponentPropsWithoutRef<'code'> & { node?: unknown }) => {
    const match = /language-mermaid/.exec(className ?? '');
    if (match) {
      return <MermaidDiagram code={String(children).replace(/\n$/, '')} />;
    }
    return <code className={className} {...rest}>{children}</code>;
  }, []);

  const handlePreBlock = useCallback(({ children, ...rest }: React.ComponentPropsWithoutRef<'pre'> & { node?: unknown }) => {
    const isMermaid = typeof children === 'object' && children !== null && 'type' in children && String((children as React.ReactElement).props?.className).includes('language-mermaid');
    if (isMermaid) {
      return <pre className="bg-transparent p-0 not-prose" {...rest}>{children}</pre>;
    }
    return <pre {...rest}>{children}</pre>;
  }, []);

  return (
    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-table:text-sm prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border-gray-200 prose-th:border-gray-200 prose-img:rounded-lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{ code: handleCodeBlock, pre: handlePreBlock }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}