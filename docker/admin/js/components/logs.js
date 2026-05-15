window.App = window.App || {};
window.App.pages = window.App.pages || {};
(function(){
'use strict';
App.pages.logs = async function(container) {
    App.layout.setTitle('Logs');
    container.innerHTML = `<div class="search-bar">
        <input type="text" placeholder="Search logs..." id="log-search">
        <button class="btn btn-outline" id="btn-refresh">Refresh</button>
        <button class="btn btn-outline" id="btn-auto" style="display:flex;align-items:center;gap:4px">
            <input type="checkbox" id="chk-auto" style="width:auto"> Auto (5s)
        </button>
        <button class="btn btn-danger btn-sm" id="btn-clear">Clear Logs</button>
    </div>
    <div id="log-viewer" class="log-viewer">Loading...</div>`;
    let timer = null;
    document.getElementById('btn-refresh').onclick = loadLogs;
    document.getElementById('chk-auto').onchange = function() {
        if (this.checked) { timer = setInterval(loadLogs, 5000); }
        else { clearInterval(timer); timer = null; }
    };
    document.getElementById('btn-clear').onclick = async () => {
        App.modal.confirm({title:'Clear Logs',message:'Delete all log entries?',danger:true,
            onConfirm: async () => { await App.api.clearLogs(); App.notify.success('Logs cleared'); loadLogs(); }
        });
    };
    document.getElementById('log-search').addEventListener('input', loadLogs);
    await loadLogs();
    async function loadLogs() {
        try {
            const q = document.getElementById('log-search').value.trim();
            const params = {};
            if (q) params.keyword = q;
            const res = await App.api.getLogs(params);
            const data = App.unwrap(res) || [];
            const viewer = document.getElementById('log-viewer');
            if (!data.length) { viewer.innerHTML = '<div class="empty"><p>No log entries</p></div>'; return; }
            viewer.innerHTML = data.reverse().map(l => {
                let cls = '';
                if (l.level==='error'||(l.message||'').includes('ERROR')) cls = 'lvl-error';
                else if (l.level==='warn'||(l.message||'').includes('WARN')) cls = 'lvl-warn';
                else if (l.level==='info'||(l.message||'').includes('INFO')) cls = 'lvl-info';
                return `<div class="${cls}">[${App.fmt.date(l.time)}] ${App.fmt.escapeHtml(l.message||'')}</div>`;
            }).join('');
        } catch(e) { document.getElementById('log-viewer').innerHTML = 'Error: '+App.fmt.escapeHtml(e.message); }
    }
};
})();
