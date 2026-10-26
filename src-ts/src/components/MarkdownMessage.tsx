import { parseMarkdown, renderTextBlock } from '../helpers/markdown';

type MarkdownMessageProps = {
  content: string;
};

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const parts = parseMarkdown(content);

  return (
    <div className='markdown-message'>
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <pre key={`code-${index}`} className='markdown-codeblock'>
              {part.language && <span className='markdown-code-language'>{part.language}</span>}
              <code>{part.content}</code>
            </pre>
          );
        }

        return renderTextBlock(part.content, index);
      })}
    </div>
  );
}
