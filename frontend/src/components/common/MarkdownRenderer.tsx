"use client";

import React, { useMemo } from "react";
import { marked } from "marked";

// Global marked configuration for external links
marked.use({
  renderer: {
    link(token) {
      const href = token.href || "";
      const text = token.text || "";
      const title = token.title ? ` title="${token.title}"` : "";
      const isExternal = /^https?:\/\//i.test(href);
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${href}"${target}${title}>${text}</a>`;
    },
  },
});

interface MarkdownRendererProps {
  content?: string | null;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const html = useMemo(() => {
    if (!content) return "";

    // Transform GitHub-style blockquote alerts (e.g. > [!NOTE])
    const formatted = content.replace(
      />\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gi,
      (_, type) => {
        const t = type.toUpperCase();
        if (t === "NOTE" || t === "TIP") {
          return "> **Ghi chú bổ sung:**";
        }
        return "> **Lưu ý:**";
      },
    );

    try {
      let parsed = marked.parse(formatted, {
        breaks: true,
        gfm: true,
      }) as string;

      // Post-process any raw HTML anchor tags with http(s) to guarantee target="_blank"
      parsed = parsed.replace(
        /<a\b(?![^>]*\btarget=)([^>]*\bhref=["']https?:\/\/[^"']*\b[^>]*)>/gi,
        '<a target="_blank" rel="noopener noreferrer" $1>'
      );

      return parsed;
    } catch {
      return content;
    }
  }, [content]);

  if (!content) return null;

  return (
    <div
      className={`prose max-w-none text-on-surface-variant font-light text-sm md:text-base leading-relaxed space-y-4 
        [&_p]:mb-3 [&_strong]:font-bold [&_strong]:text-on-surface [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary-hover
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5
        [&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:text-on-surface [&_h1]:mt-6 [&_h1]:mb-3
        [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-on-surface [&_h2]:mt-5 [&_h2]:mb-2.5
        [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-on-surface [&_h3]:mt-4 [&_h3]:mb-2
        [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-primary/5 [&_blockquote]:px-4 [&_blockquote]:py-3 
        [&_blockquote]:my-4 [&_blockquote]:text-on-surface [&_blockquote]:not-italic ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
