window.App = window.App || {};
(function(){
'use strict';
const App = window.App;

App.config = { apiPrefix:'/api', downloadPrefix:'/download', sharePrefix:'/share', shortlinkPrefix:'/s', adminPrefix:'/admin' };

App.api = {
    async req(method, url, body, opts={}) {
        const headers = {'Content-Type':'application/json'};
        if (opts.headers) Object.assign(headers, opts.headers);
        const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
        const ct = res.headers.get('content-type')||'';
        if (ct.includes('application/json')) return res.json();
        if (opts.text) return res.text();
        return res;
    },
    get(url) { return App.api.req('GET', url); },
    post(url, body) { return App.api.req('POST', url, body); },
    patch(url, body) { return App.api.req('PATCH', url, body); },
    del(url) { return App.api.req('DELETE', url); },
    put(url, body) { return App.api.req('PUT', url, body); },

    // Backend API shortcuts
    be(path) { return App.config.apiPrefix + path; },
    async getSubs() { return App.api.get(App.api.be('/subs')); },
    async getSub(name,opts) { return App.api.req('GET', App.api.be('/sub/'+encodeURIComponent(name)),null,opts); },
    async createSub(data) { return App.api.post(App.api.be('/subs'), data); },
    async updateSub(name,data) { return App.api.patch(App.api.be('/sub/'+encodeURIComponent(name)), data); },
    async deleteSub(name,mode) { return App.api.del(App.api.be('/sub/'+encodeURIComponent(name))+'?mode='+(mode||'archive')); },
    async getCols() { return App.api.get(App.api.be('/collections')); },
    async getCol(name,opts) { return App.api.req('GET', App.api.be('/collection/'+encodeURIComponent(name)),null,opts); },
    async createCol(data) { return App.api.post(App.api.be('/collections'), data); },
    async updateCol(name,data) { return App.api.patch(App.api.be('/collection/'+encodeURIComponent(name)), data); },
    async deleteCol(name,mode) { return App.api.del(App.api.be('/collection/'+encodeURIComponent(name))+'?mode='+(mode||'archive')); },
    async getFiles() { return App.api.get(App.api.be('/files')); },
    async getFile(name,opts) { return App.api.req('GET', App.api.be('/wholeFile/'+encodeURIComponent(name)),null,opts); },
    async createFile(data) { return App.api.post(App.api.be('/files'), data); },
    async updateFile(name,data) { return App.api.patch(App.api.be('/file/'+encodeURIComponent(name)), data); },
    async deleteFile(name,mode) { return App.api.del(App.api.be('/file/'+encodeURIComponent(name))+'?mode='+(mode||'archive')); },
    async getArtifacts() { return App.api.get(App.api.be('/artifacts')); },
    async getArtifact(name) { return App.api.get(App.api.be('/artifact/'+encodeURIComponent(name))); },
    async createArtifact(data) { return App.api.post(App.api.be('/artifacts'), data); },
    async updateArtifact(name,data) { return App.api.patch(App.api.be('/artifact/'+encodeURIComponent(name)), data); },
    async deleteArtifact(name,mode) { return App.api.del(App.api.be('/artifact/'+encodeURIComponent(name))+'?mode='+(mode||'archive')); },
    async syncArtifacts() { return App.api.get(App.api.be('/sync/artifacts')); },
    async syncArtifact(name) { return App.api.get(App.api.be('/sync/artifact/'+encodeURIComponent(name))); },
    async getTokens(opts) { let q=''; if(opts) q='?'+new URLSearchParams(opts).toString(); return App.api.get(App.api.be('/tokens')+q); },
    async createToken(data) { return App.api.post(App.api.be('/token'), data); },
    async deleteToken(tok,type,name) { return App.api.del(App.api.be('/token/'+tok+'?type='+type+'&name='+encodeURIComponent(name))); },
    async getModules() { return App.api.get(App.api.be('/modules')); },
    async getModule(name) { return App.api.req('GET', App.api.be('/module/'+encodeURIComponent(name)),null,{text:true}); },
    async createModule(data) { return App.api.post(App.api.be('/modules'), data); },
    async updateModule(name,data) { return App.api.patch(App.api.be('/module/'+encodeURIComponent(name)), data); },
    async deleteModule(name) { return App.api.del(App.api.be('/module/'+encodeURIComponent(name))); },
    async getArchives() { return App.api.get(App.api.be('/archives')); },
    async deleteArchive(id) { return App.api.del(App.api.be('/archives/'+id)); },
    async restoreArchive(id) { return App.api.post(App.api.be('/archives/'+id+'/restore')); },
    async getLogs(params) { let q=''; if(params) q='?'+new URLSearchParams(params).toString(); return App.api.get(App.api.be('/logs')+q); },
    async clearLogs() { return App.api.del(App.api.be('/logs')); },
    async getSettings() { return App.api.get(App.api.be('/settings')); },
    async updateSettings(data) { return App.api.patch(App.api.be('/settings'), data); },
    async getEnv() { return App.api.get(App.api.be('/utils/env')); },
    async previewSub(data,target) { return App.api.post(App.api.be('/preview/sub?target='+(target||'JSON')), data); },
    async previewCol(data,target) { return App.api.post(App.api.be('/preview/collection?target='+(target||'JSON')), data); },
    async previewFile(data) { return App.api.post(App.api.be('/preview/file'), data); },
    async sortSubs(names) { return App.api.post(App.api.be('/sort/subs'), names); },
    async sortCols(names) { return App.api.post(App.api.be('/sort/collections'), names); },
    async sortFiles(names) { return App.api.post(App.api.be('/sort/files'), names); },
    async sortArtifacts(names) { return App.api.post(App.api.be('/sort/artifacts'), names); },
    async getStorage() { return App.api.req('GET', App.api.be('/storage'),null,{text:true}); },
    async restoreStorage(content) { return App.api.post(App.api.be('/storage'), {content}); },

    // Admin API
    admin(path) { return App.config.adminPrefix + '/api' + path; },
    async getShortlinks() { return App.api.get(App.api.admin('/shortlinks')); },
    async createShortlink(data) { return App.api.post(App.api.admin('/shortlinks'), data); },
    async deleteShortlink(code) { return App.api.del(App.api.admin('/shortlinks/'+code)); },
};

App.unwrap = function(resp) {
    if (!resp) throw new Error('No response');
    if (resp.status === 'success') return resp.data;
    throw new Error(resp.error?.message || resp.error?.details || 'Unknown error');
};
})();
