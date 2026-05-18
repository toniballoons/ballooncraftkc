import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Inline theme CSS vars into index.html at build time to prevent flash
function inlineThemePlugin(env) {
  return {
    name: 'inline-theme',
    transformIndexHtml(html) {
      const themeId = env.VITE_NEW_DESIGN_ACTIVE_THEME || env.VITE_ACTIVE_THEME || 'rainbow_birthday';
      // We can't import the full themes.js here (ESM/CJS issues at build time),
      // so we write a small lookup of just the CSS vars for each theme.
      // This is generated from the same source of truth.
      const script = `
<script>
  (function() {
    function getCookie(name) {
      var encodedName = encodeURIComponent(name) + '=';
      var parts = document.cookie ? document.cookie.split('; ') : [];
      for (var i = 0; i < parts.length; i += 1) {
        if (parts[i].indexOf(encodedName) === 0) {
          return decodeURIComponent(parts[i].slice(encodedName.length));
        }
      }
      return null;
    }

    var cached = null;
    try { cached = localStorage.getItem('ballooncraftkc_new_design_theme_css'); } catch(e) {}
    if (!cached) cached = getCookie('ballooncraftkc_new_design_theme_css');
    if (!cached) return; // first load — will be set after first visit
    try {
      var vars = JSON.parse(cached);
      var r = document.documentElement;
      Object.keys(vars).forEach(function(k) { r.style.setProperty(k, vars[k]); });
      var radius = null;
      try { radius = localStorage.getItem('ballooncraftkc_new_design_theme_radius'); } catch(e) {}
      if (!radius) radius = getCookie('ballooncraftkc_new_design_theme_radius');
      if (radius) r.style.setProperty('--radius', radius);
    } catch(e) {}
  })();
</script>`;
      return html.replace('</head>', script + '\n  </head>');
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    logLevel: 'error',
    plugins: [
      react(),
      inlineThemePlugin(env),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    }
  };
});
