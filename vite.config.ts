import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';

function ttsProxyPlugin(): Plugin {
  return {
    name: 'tts-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/tts')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const text = urlObj.searchParams.get('text') || '';
            const lang = urlObj.searchParams.get('lang') || 'vi';
            if (!text.trim()) {
              res.statusCode = 400;
              return res.end('Missing text');
            }

            const cleanText = text.trim().slice(0, 200);
            const targetLang = lang.toLowerCase().startsWith('zh') 
              ? 'zh-CN' 
              : lang.toLowerCase().startsWith('en') 
                ? 'en' 
                : 'vi';
            const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetLang}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

            const response = await fetch(googleUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/'
              }
            });

            if (!response.ok) {
              res.statusCode = response.status;
              return res.end('TTS Fetch error');
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Content-Length', buffer.length);
            res.end(buffer);
          } catch (e) {
            console.error('TTS Proxy error:', e);
            res.statusCode = 500;
            res.end('Internal TTS error');
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(({mode}) => {
  return {
    plugins: [react(), tailwindcss(), ttsProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
