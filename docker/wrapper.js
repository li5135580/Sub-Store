const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const history = require('connect-history-api-fallback');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const BACKEND_PORT = process.env.SUB_STORE_BACKEND_API_PORT || 3000;
const FRONTEND_PATH = process.env.SUB_STORE_FRONTEND_PATH || '/app/frontend';

const API_PREFIX = process.env.SUB_STORE_API_PREFIX || '/api';
const DOWNLOAD_PREFIX = process.env.SUB_STORE_DOWNLOAD_PREFIX || '/download';
const SHARE_PREFIX = process.env.SUB_STORE_SHARE_PREFIX || '/share';
const SHORTLINK_PREFIX = process.env.SUB_STORE_SHORTLINK_PREFIX || '/s';
const ADMIN_PREFIX = process.env.SUB_STORE_ADMIN_PREFIX || '/admin';
const ADMIN_PATH = process.env.SUB_STORE_ADMIN_PATH || '/app/admin';
const DATA_DIR = process.env.SUB_STORE_DATA_BASE_PATH || '/data';
const SL_FILE = path.join(DATA_DIR, 'shortlinks.json');

const app = express();
app.use(express.json());

// ---- Helpers ----

function loadShortlinks() {
    try { if (fs.existsSync(SL_FILE)) return JSON.parse(fs.readFileSync(SL_FILE, 'utf-8')); }
    catch (e) { console.error('[WRAPPER] Failed to load shortlinks:', e.message); }
    return [];
}
function saveShortlinks(data) {
    try { fs.writeFileSync(SL_FILE, JSON.stringify(data, null, 2), 'utf-8'); }
    catch (e) { console.error('[WRAPPER] Failed to save shortlinks:', e.message); }
}
function genCode() {
    return crypto.randomBytes(5).toString('base64url').substring(0, 6);
}

// ---- 1. Short link resolution ----

app.get(`${SHORTLINK_PREFIX}/:code`, (req, res) => {
    const list = loadShortlinks();
    const sl = list.find(s => s.code === req.params.code);
    if (!sl) return res.status(404).send('Short link not found');

    let url;
    if (sl.type === 'sub') url = `${DOWNLOAD_PREFIX}/${encodeURIComponent(sl.name)}`;
    else if (sl.type === 'col') url = `${DOWNLOAD_PREFIX}/collection/${encodeURIComponent(sl.name)}`;
    else if (sl.type === 'file') url = `${SHARE_PREFIX}/file/${encodeURIComponent(sl.name)}`;
    else return res.status(400).send('Invalid short link type');

    if (sl.target) url += `/${sl.target}`;
    if (sl.query) url += `?${sl.query}`;
    res.redirect(302, url);
});

// ---- 2. Admin API endpoints (before static middleware) ----

app.get(`${ADMIN_PREFIX}/api/config`, (_req, res) => {
    res.json({
        apiPrefix: API_PREFIX,
        downloadPrefix: DOWNLOAD_PREFIX,
        sharePrefix: SHARE_PREFIX,
        shortlinkPrefix: SHORTLINK_PREFIX,
        adminPrefix: ADMIN_PREFIX,
    });
});

app.get(`${ADMIN_PREFIX}/api/shortlinks`, (_req, res) => {
    res.json({ status: 'success', data: loadShortlinks() });
});

app.post(`${ADMIN_PREFIX}/api/shortlinks`, (req, res) => {
    const { type, name, target, query, code } = req.body || {};
    if (!type || !name) return res.status(400).json({ status: 'failed', error: { message: 'type and name are required' } });
    if (!['sub', 'col', 'file'].includes(type)) return res.status(400).json({ status: 'failed', error: { message: 'type must be sub, col, or file' } });

    const list = loadShortlinks();
    const slCode = code || genCode();
    if (list.find(s => s.code === slCode)) return res.status(400).json({ status: 'failed', error: { message: 'Code already exists' } });

    const sl = { code: slCode, type, name, target: target || '', query: query || '', createdAt: Date.now() };
    list.push(sl);
    saveShortlinks(list);
    res.status(201).json({ status: 'success', data: sl });
});

app.delete(`${ADMIN_PREFIX}/api/shortlinks/:code`, (req, res) => {
    let list = loadShortlinks();
    const idx = list.findIndex(s => s.code === req.params.code);
    if (idx === -1) return res.status(404).json({ status: 'failed', error: { message: 'Short link not found' } });
    list.splice(idx, 1);
    saveShortlinks(list);
    res.json({ status: 'success' });
});

// ---- 3. API/DL/Share proxy to backend ----

const apiProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${BACKEND_PORT}`,
    changeOrigin: true,
    pathRewrite: (p) => `/api${p}`,
});
const dlProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${BACKEND_PORT}`,
    changeOrigin: true,
    pathRewrite: (p) => `/download${p}`,
});
const shareProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${BACKEND_PORT}`,
    changeOrigin: true,
    pathRewrite: (p) => `/share${p}`,
});

app.use(API_PREFIX, apiProxy);
app.use(DOWNLOAD_PREFIX, dlProxy);
app.use(SHARE_PREFIX, shareProxy);

// ---- 4. Admin static files + SPA fallback ----

app.use(ADMIN_PREFIX, express.static(ADMIN_PATH));
app.use(ADMIN_PREFIX, (req, res) => {
    res.sendFile(path.join(ADMIN_PATH, 'index.html'));
});

// ---- 5. Original frontend SPA ----

app.use(history({ disableDotRule: true, verbose: false }));
app.use(express.static(FRONTEND_PATH));

// ---- Start ----

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WRAPPER] listening on 0.0.0.0:${PORT}`);
    console.log(`[WRAPPER] static: ${FRONTEND_PATH}`);
    console.log(`[WRAPPER] admin: ${ADMIN_PREFIX} -> ${ADMIN_PATH}`);
    console.log(`[WRAPPER] proxy: ${API_PREFIX} ${DOWNLOAD_PREFIX} ${SHARE_PREFIX} -> 127.0.0.1:${BACKEND_PORT}`);
    console.log(`[WRAPPER] shortlink: ${SHORTLINK_PREFIX}`);
});
