// Generates site/privacy.html from PRIVACY.md so the website and the repo never disagree.
// Handles only the Markdown PRIVACY.md uses: headings, paragraphs, bullet lists, links, bold, italics.
import { readFileSync, writeFileSync } from 'node:fs';

const escape = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (t) =>
  escape(t)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)_([^_]+)_(?=\s|$|[.,])/g, '$1<em>$2</em>');

function toHtml(markdown) {
  const out = [];
  let list = false;
  const closeList = () => {
    if (list) out.push('</ul>');
    list = false;
  };
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^(#{1,3}) (.+)/.exec(line);
    if (heading) {
      closeList();
      out.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
    } else if (line.startsWith('- ')) {
      if (!list) out.push('<ul>');
      list = true;
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (line.trim()) {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}

// PRIVACY.md points to "the website's own privacy policy"; this section is that policy.
const websiteSection = `
## This website

This website uses no cookies, analytics, advertising or third-party resources (no external fonts, scripts or embeds). The only thing it stores is your theme choice (light or dark), in your own browser. It is hosted on GitHub Pages, which, like any web host, logs visitors' IP addresses; see the [GitHub General Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).
`;

const body = toHtml(readFileSync('PRIVACY.md', 'utf8') + websiteSection);

writeFileSync(
  'site/privacy.html',
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Privacy Policy — PDF Diva</title>
  <meta name="description" content="PDF Diva collects nothing. Read the full privacy policy.">
  <meta name="color-scheme" content="light dark">
  <link rel="icon" href="assets/img/favicon.ico" sizes="16x16 32x32">
  <script>
    try { var t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch (e) {}
  </script>
  <link rel="stylesheet" href="assets/css/site.css">
</head>
<body>
  <header class="site-header wrap">
    <a class="brand" href="./"><img src="assets/img/icon-64.png" alt="" width="32" height="32"> PDF Diva</a>
  </header>
  <main class="wrap prose">
${body}
  </main>
  <footer class="site-footer">
    <div class="wrap footer-row">
      <span>PDF Diva · GPL-3.0-or-later · Made by <a href="https://nilovelez.com">Nilo Vélez</a></span>
      <span class="footer-links"><a href="./">Home</a><a href="https://github.com/nilovelez/pdf-diva/issues">Report an issue</a></span>
    </div>
  </footer>
</body>
</html>
`,
);
