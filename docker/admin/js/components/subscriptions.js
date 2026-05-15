window.App = window.App || {};
window.App.pages = window.App.pages || {};
(function(){
'use strict';
App.pages.subscriptions = async function(container) {
    App.layout.setTitle('Subscriptions');
    container.innerHTML = '<div class="btn-group" style="margin-bottom:16px"><button class="btn btn-accent" id="btn-new">+ New Subscription</button></div><div id="tbl"></div>';
    document.getElementById('btn-new').onclick = () => showEdit(null);
    await refresh();
    async function refresh() {
        try {
            const res = await App.api.getSubs();
            const data = App.unwrap(res) || [];
            App.table.create({
                container: document.getElementById('tbl'),
                columns: [
                    {key:'name',label:'Name'},
                    {key:'displayName',label:'Display Name'},
                    {key:'source',label:'Source',render:v=>`<span class="badge ${v==='remote'?'badge-blue':'badge-green'}">${App.fmt.escapeHtml(v||'remote')}</span>`},
                    {key:'url',label:'URL',truncate:50},
                ],
                data,
                actions: [{key:'edit',label:'Edit'},{key:'flow',label:'Flow'},{key:'delete',label:'Delete'}],
                onAction(action, row) {
                    if (action==='edit') showEdit(row);
                    if (action==='flow') showFlow(row);
                    if (action==='delete') deleteItem(row);
                },
                searchable: true,
                emptyMessage: 'No subscriptions yet'
            });
        } catch(e) { App.notify.error('Failed to load: '+e.message); }
    }
    function showEdit(row) {
        const fields = ['name','displayName','url','content','ua','proxy','source','subUserinfo','tag','remark','mergeSources','ignoreFailedRemoteSub'];
        const vals = row||{};
        const body = fields.map(f => {
            if (f==='source') return `<div class="form-group"><label>Source</label><select id="f_${f}"><option value="remote" ${vals[f]==='remote'?'selected':''}>Remote</option><option value="local" ${vals[f]==='local'?'selected':''}>Local</option></select></div>`;
            if (f==='content') return `<div class="form-group" id="g_content" style="${vals.source==='local'?'':'display:none'}"><label>Content</label><textarea id="f_${f}">${App.fmt.escapeHtml(vals[f]||'')}</textarea></div>`;
            if (f==='tag') return `<div class="form-group"><label>Tags (comma separated)</label><input id="f_${f}" value="${App.fmt.escapeHtml(Array.isArray(vals[f])?vals[f].join(','):vals[f]||'')}">`;
            return `<div class="form-group"><label>${f}</label><input id="f_${f}" value="${App.fmt.escapeHtml(vals[f]||'')}">`;
        }).join('');
        App.modal.show({
            title: row?'Edit Subscription':'New Subscription',
            size: 'lg',
            body,
            onSave: async (ov) => {
                const data = {};
                fields.forEach(f => { const el=ov.querySelector('#f_'+f); if(el) data[f]=el.value; });
                if (!data.name) throw new Error('Name is required');
                if (data.name.includes('/')) throw new Error('Name cannot contain /');
                if (data.tag) data.tag = data.tag.split(',').map(s=>s.trim()).filter(Boolean);
                if (row) {
                    const res = await App.api.updateSub(row.name, data);
                    App.unwrap(res);
                } else {
                    const res = await App.api.createSub(data);
                    App.unwrap(res);
                }
                App.notify.success(row?'Updated':'Created');
                await refresh();
            }
        });
        const sel = document.getElementById('f_source');
        if (sel) sel.onchange = () => { document.getElementById('g_content').style.display = sel.value==='local'?'block':'none'; };
    }
    async function showFlow(row) {
        try {
            const res = await App.api.req('GET', App.api.be('/sub/flow/'+encodeURIComponent(row.name)));
            const data = App.unwrap(res) || res;
            App.notify.success('Flow info loaded. Check console for details.');
            console.log('Flow:', data);
        } catch(e) { App.notify.error('Failed to get flow: '+e.message); }
    }
    async function deleteItem(row) {
        App.modal.confirm({
            title: 'Delete Subscription',
            message: `Delete "${row.name}"? This will archive the item.`,
            danger: true,
            onConfirm: async () => {
                await App.api.deleteSub(row.name, 'archive');
                App.notify.success('Deleted (archived)');
                await refresh();
            }
        });
    }
};
})();
