To render markdown, use `markdown-to-jsx` with `@tailwindcss/typography`.

You might then do something like:

```
function DocPage({ content }) {
  return (
    <article className="prose prose-lg max-w-none">
      <Markdown>{content}</Markdown>
    </article>
  );
}
```
