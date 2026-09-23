import type { ReactNode } from 'react';

type MarkdownMessageProps = {
  content: string;
};

type MarkdownPart =
  | { type: 'text'; content: string }
  | { type: 'code'; content: string; language?: string };

const fencedCodeBlockRegex = /```([^\n`]*)\n?([\s\S]*?)```/g;
const inlineMarkdownRegex =
  /(\[([^\]]+)]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;

const parseMarkdown = (content: string): MarkdownPart[] => {
  const parts: MarkdownPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fencedCodeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }

    parts.push({
      type: 'code',
      language: match[1]?.trim() || undefined,
      content: match[2].replace(/\n$/, ''),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return parts;
};

const renderInlineMarkdown = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineMarkdownRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      nodes.push(
        <a key={`link-${match.index}`} href={match[3]} target='_blank' rel='noreferrer'>
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      nodes.push(<code key={`code-${match.index}`}>{match[4]}</code>);
    } else if (match[5]) {
      nodes.push(<strong key={`strong-${match.index}`}>{match[5]}</strong>);
    } else if (match[6]) {
      nodes.push(<em key={`em-${match.index}`}>{match[6]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

const renderTextBlock = (content: string, partIndex: number) => {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph, paragraphIndex) => {
    const lines = paragraph.split('\n');

    return (
      <p key={`paragraph-${partIndex}-${paragraphIndex}`} className='markdown-paragraph'>
        {lines.map((line, lineIndex) => (
          <span key={`line-${lineIndex}`}>
            {renderInlineMarkdown(line)}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
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
