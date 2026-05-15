window.App = window.App || {};
window.App.pages = window.App.pages || {};
(function(){
'use strict';
App.pages.collections = async function(container) {
    App.layout.setTitle('Collections');
    container.innerHTML = '<div class="btn-group" style="margin-bottom:16px"><button class="btn btn-accent" id="btn-new">+ New Collection</button></div><div id="tbl"></div>';
    document.getElementById('btn-new').onclick = () => showEdit(null);
    await refresh();
    async function refresh() {
        try {
            const res = await App.api.getCols();
            const data = App.unwrap(res) || [];
            App.table.create({
                container: document.getElementById('tbl'),
                columns: [
                    {key:'name',label:'Name'},
                    {key:'displayName',label:'Display Name'},
                    {key:'subscriptions',label:'Subs',render:v=>`<span class="badge badge-blue">${Array.isArray(v)?v.length:0}</span>`},
                    {key:'subscriptionTags',label:'Tags',render:v=>Array.isArray(v)&&v.length?`<div class="tag-list">${v.map(t=>`<span class="tag">${App.fmt.escapeHtml(t)}</span>`).join('')}</div>`:'-'},
                ],
                data,
                actions: [{key:'edit',label:'Edit'},{key:'delete',label:'Delete'}],
                onAction(action, row) {
                    if (action==='edit') showEdit(row);
                    if (action==='delete') deleteItem(row);
                },
                searchable: true,
                emptyMessage: 'No collections yet'
            });
        } catch(e) { App.notify.error('Failed to load: '+e.message); }
    }
    function showEdit(row) {
        const fields = ['name','displayName','subscriptions','subscriptionTags','proxy','subUserinfo','tag','remark'];
        const vals = row||{};
        const body = fields.map(f => {
            if (f==='subscriptions') return `<div class="form-group"><label>Subscription Names (one per line)</label><textarea id="f_${f}">${App.fmt.escapeHtml(Array.isArray(vals[f])?vals[f].join('\n'):vals[f]||'')}</textarea></div>`;
            if (f==='subscriptionTags'||f==='tag') return `<div class="form-group"><label>${f} (comma separated)</label><input id="f_${f}" value="${App.fmt.escapeHtml(Array.isArray(vals[f])?vals[f].join(','):vals[f]||'')}">`;
            return `<div class="form-group"><label>${f}</label><input id="f_${f}" value="${App.fmt.escapeHtml(vals[f]||'')}">`;
        }).join('');
        App.modal.show({
            title: row?'Edit Collection':'New Collection', size:'lg', body,
            onSave: async (ov) => {
                const data = {};
                fields.forEach(f => { const el=ov.querySelector('#f_'+f); if(el) data[f]=el.value; });
                if (!data.name) throw new Error('Name is required');
                if (data.name.includes('/')) throw new Error('Name cannot contain /');
                if (data.subscriptions) data.subscriptions = data.subscriptions.split('\n').map(s=>s.trim()).filter(Boolean);
                if (data.subscriptionTags) data.subscriptionTags = data.subscriptionTags.split(',').map(s=>s.trim()).filter(Boolean);
                if (data.tag) data.tag = data.tag.split(',').map(s=>s.trim()).filter(Boolean);
                if (row) { const res = await App.api.updateCol(row.name, data); App.unwrap(res); }
                else { const res = await App.api.createCol(data); App.unwrap(res); }
                App.notify.success(row?'Updated':'Created');
                await refresh();
            }
        });
    }
    async function deleteItem(row) {
        App.modal.confirm({
            title: 'Delete Collection', message: `Delete "${row.name}"?`, danger:true,
            onConfirm: async () => { await App.api.deleteCol(row.name, 'archive'); App.notify.success('Deleted'); await refresh(); }
        });
    }
};
})();
