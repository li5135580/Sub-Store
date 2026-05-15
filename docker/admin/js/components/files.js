window.App = window.App || {};
window.App.pages = window.App.pages || {};
(function(){
'use strict';
App.pages.files = async function(container) {
    App.layout.setTitle('Files');
    container.innerHTML = '<div class="btn-group" style="margin-bottom:16px"><button class="btn btn-accent" id="btn-new">+ New File</button></div><div id="tbl"></div>';
    document.getElementById('btn-new').onclick = () => showEdit(null);
    await refresh();
    async function refresh() {
        try {
            const res = await App.api.getFiles();
            const data = App.unwrap(res) || [];
            App.table.create({
                container: document.getElementById('tbl'),
                columns: [
                    {key:'name',label:'Name'},
                    {key:'displayName',label:'Display Name'},
                    {key:'source',label:'Source',render:v=>`<span class="badge ${v==='remote'?'badge-blue':'badge-green'}">${App.fmt.escapeHtml(v||'remote')}</span>`},
                    {key:'type',label:'Type',render:v=>v?`<span class="badge badge-yellow">${App.fmt.escapeHtml(v)}</span>`:'-'},
                ],
                data,
                actions: [{key:'edit',label:'Edit'},{key:'view',label:'View'},{key:'delete',label:'Delete'}],
                onAction(action, row) {
                    if (action==='edit') showEdit(row);
                    if (action==='view') showContent(row);
                    if (action==='delete') deleteItem(row);
                },
                searchable: true,
                emptyMessage: 'No files yet'
            });
        } catch(e) { App.notify.error('Failed to load: '+e.message); }
    }
    function showEdit(row) {
        const fields = ['name','displayName','url','content','ua','proxy','source','type','tag','remark','mergeSources'];
        const vals = row||{};
        const body = fields.map(f => {
            if (f==='source') return `<div class="form-group"><label>Source</label><select id="f_${f}"><option value="remote" ${vals[f]==='remote'?'selected':''}>Remote</option><option value="local" ${vals[f]==='local'?'selected':''}>Local</option></select></div>`;
            if (f==='content') return `<div class="form-group"><label>Content</label><textarea id="f_${f}" rows="6">${App.fmt.escapeHtml(vals[f]||'')}</textarea></div>`;
            if (f==='tag') return `<div class="form-group"><label>Tags (comma separated)</label><input id="f_${f}" value="${App.fmt.escapeHtml(Array.isArray(vals[f])?vals[f].join(','):vals[f]||'')}">`;
            return `<div class="form-group"><label>${f}</label><input id="f_${f}" value="${App.fmt.escapeHtml(vals[f]||'')}">`;
        }).join('');
        App.modal.show({
            title: row?'Edit File':'New File', size:'lg', body,
            onSave: async (ov) => {
                const data = {};
                fields.forEach(f => { const el=ov.querySelector('#f_'+f); if(el) data[f]=el.value; });
                if (!data.name) data.name = String(Date.now());
                if (data.tag) data.tag = data.tag.split(',').map(s=>s.trim()).filter(Boolean);
                if (row) { const res = await App.api.updateFile(row.name, data); App.unwrap(res); }
                else { const res = await App.api.createFile(data); App.unwrap(res); }
                App.notify.success(row?'Updated':'Created');
                await refresh();
            }
        });
    }
    async function showContent(row) {
        try {
            const res = await App.api.getFile(row.name, {text:true});
            const content = typeof res==='string'?res:JSON.stringify(res,null,2);
            App.modal.show({title:'File: '+row.name, size:'lg', body:`<pre class="json-viewer">${App.fmt.escapeHtml(content)}</pre>`});
        } catch(e) { App.notify.error('Failed: '+e.message); }
    }
    async function deleteItem(row) {
        App.modal.confirm({
            title:'Delete File', message:`Delete "${row.name}"?`, danger:true,
            onConfirm: async () => { await App.api.deleteFile(row.name, 'archive'); App.notify.success('Deleted'); await refresh(); }
        });
    }
};
})();
