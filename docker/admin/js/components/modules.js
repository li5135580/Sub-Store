window.App = window.App || {};
window.App.pages = window.App.pages || {};
(function(){
'use strict';
App.pages.modules = async function(container) {
    App.layout.setTitle('Modules');
    container.innerHTML = '<div class="btn-group" style="margin-bottom:16px"><button class="btn btn-accent" id="btn-new">+ New Module</button></div><div id="tbl"></div>';
    document.getElementById('btn-new').onclick = () => showEdit(null);
    await refresh();
    async function refresh() {
        try {
            const res = await App.api.getModules();
            const data = App.unwrap(res) || [];
            App.table.create({
                container: document.getElementById('tbl'),
                columns: [
                    {key:'name',label:'Name',truncate:40},
                ],
                data,
                actions: [{key:'view',label:'View'},{key:'edit',label:'Edit'},{key:'delete',label:'Delete'}],
                onAction(action, row) {
                    if (action==='view') showContent(row);
                    if (action==='edit') showEdit(row);
                    if (action==='delete') deleteItem(row);
                },
                searchable: true,
                emptyMessage: 'No modules yet'
            });
        } catch(e) { App.notify.error('Failed: '+e.message); }
    }
    function showEdit(row) {
        const body = `<div class="form-group"><label>Name</label><input id="f_name" value="${App.fmt.escapeHtml(row?.name||'')}"></div>
            <div class="form-group"><label>Content</label><textarea id="f_content" rows="10" placeholder="Module script content">${App.fmt.escapeHtml(row?.content||'')}</textarea></div>`;
        App.modal.show({
            title: row?'Edit Module':'New Module', size:'lg', body,
            onSave: async (ov) => {
                const data = {name: App.modal.getVal(ov,'#f_name'), content: App.modal.getVal(ov,'#f_content')};
                if (!data.name) data.name = undefined;
                if (row) { const res=await App.api.updateModule(row.name,data); App.unwrap(res); }
                else { const res=await App.api.createModule(data); App.unwrap(res); }
                App.notify.success(row?'Updated':'Created');
                await refresh();
            }
        });
    }
    async function showContent(row) {
        try {
            const content = await App.api.getModule(row.name);
            App.modal.show({title:'Module: '+row.name, size:'lg', body:`<pre class="json-viewer">${App.fmt.escapeHtml(content||'')}</pre>`});
        } catch(e) { App.notify.error('Failed: '+e.message); }
    }
    async function deleteItem(row) {
        App.modal.confirm({title:'Delete Module',message:`Delete "${row.name}"?`,danger:true,
            onConfirm: async () => { await App.api.deleteModule(row.name); App.notify.success('Deleted'); await refresh(); }
        });
    }
};
})();
