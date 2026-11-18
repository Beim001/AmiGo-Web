import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './i18n';
import App from './App.tsx';
// 字体自托管（Google Fonts 在中国大陆无法访问）
import '@fontsource/zcool-kuaile';
import '@fontsource/yellowtail';
import '@fontsource/dancing-script/700.css';
import '@fontsource/pacifico';
import '@fontsource/caveat/700.css';
import '@fontsource/satisfy';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
