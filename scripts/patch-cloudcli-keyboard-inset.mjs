import { readFileSync, writeFileSync } from 'fs';

// Injects a visualViewport listener that publishes the soft-keyboard height as
// the CSS custom property `--keyboard-inset`. The companion CSS patch wires
// `--mobile-nav-total` to that variable so the mobile chat column gains
// bottom padding equal to the keyboard height while typing (lifting the input
// above the keyboard) and collapses back to the safe-area inset when closed.
// Without this, the removed mobile nav left no inset and the keyboard covered
// the chat input on Android Chrome.

const DEFAULT_HTML_PATH = '/usr/local/lib/node_modules/@siteboon/claude-code-ui/dist/index.html';
const HTML_PATH = process.argv[2] || DEFAULT_HTML_PATH;
const ERROR_MESSAGE = '[patch] ERROR: CloudCLI index.html keyboard-inset anchor not found';
const PATCH_MARKER = 'holyclaude-keyboard-inset';
const ANCHOR = '</body>';

const injectedScript = `    <!-- ${PATCH_MARKER}: lift the mobile chat input above the soft keyboard -->
    <script>
      (function () {
        var vv = window.visualViewport;
        if (!vv) return;
        var root = document.documentElement;
        function update() {
          var inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
          if (inset > 0) root.style.setProperty('--keyboard-inset', inset + 'px');
          else root.style.removeProperty('--keyboard-inset');
        }
        vv.addEventListener('resize', update);
        vv.addEventListener('scroll', update);
        window.addEventListener('orientationchange', function () { setTimeout(update, 300); });
        update();
      })();
    </script>
`;

let source;
try {
  source = readFileSync(HTML_PATH, 'utf8');
} catch (error) {
  console.error(ERROR_MESSAGE);
  process.exit(1);
}

if (source.includes(PATCH_MARKER)) {
  console.log('[patch] keyboard inset already applied');
  process.exit(0);
}

if (!source.includes(ANCHOR)) {
  console.error(ERROR_MESSAGE);
  process.exit(1);
}

source = source.replace(ANCHOR, `${injectedScript}  ${ANCHOR}`);
writeFileSync(HTML_PATH, source);
console.log('[patch] keyboard inset listener injected');
