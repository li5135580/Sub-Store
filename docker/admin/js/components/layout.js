window.App = window.App || {};
(function(){
'use strict';
App.layout = {
    render() {
        document.getElementById('app').innerHTML = `
            <aside class="sidebar">
                <div class="sidebar-brand">Sub-Store Admin</div>
                <nav class="sidebar-nav">
                    <a href="#dashboard"><span class="ico">&#9632;</span><span>Dashboard</span></a>
                    <a href="#subscriptions"><span class="ico">&#9881;</span><span>Subscriptions</span></a>
                    <a href="#collections"><span class="ico">&#9737;</span><span>Collections</span></a>
                    <a href="#files"><span class="ico">&#9993;</span><span>Files</span></a>
                    <a href="#artifacts"><span class="ico">&#9733;</span><span>Artifacts</span></a>
                    <a href="#tokens"><span class="ico">&#9919;</span><span>Tokens</span></a>
                    <a href="#modules"><span class="ico">&#9776;</span><span>Modules</span></a>
                    <a href="#archives"><span class="ico">&#9852;</span><span>Archives</span></a>
                    <a href="#logs"><span class="ico">&#9776;</span><span>Logs</span></a>
                    <a href="#shortlinks"><span class="ico">&#128279;</span><span>Short Links</span></a>
                    <a href="#settings"><span class="ico">&#9881;</span><span>Settings</span></a>
                </nav>
            </aside>
            <div class="main">
                <div class="topbar">
                    <span class="topbar-title" id="topbar-title">Dashboard</span>
                    <div class="topbar-right" id="topbar-info"></div>
                </div>
                <div class="content" id="content"></div>
            </div>`;
        this._loadEnv();
    },
    setTitle(t) { const el = document.getElementById('topbar-title'); if(el) el.textContent = t; },
    async _loadEnv() {
        try {
            const resp = await App.api.getEnv();
            const d = resp?.data || resp;
            const v = d?.version || d?.meta?.node?.version || '-';
            document.getElementById('topbar-info').textContent = 'v'+(d?.version||'-')+' | Node '+(d?.meta?.node?.version||'-');
        } catch(e) { document.getElementById('topbar-info').textContent = 'Loading...'; }
    },
};
})();
