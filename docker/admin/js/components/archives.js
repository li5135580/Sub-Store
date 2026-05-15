window.App = window.App || {};
window.App.pages = window.App.pages || {};
(function(){
'use strict';
App.pages.archives = async function(container) {
    App.layout.setTitle('Archives');
    container.innerHTML = '<div id="tbl"></div>';
    await refresh();
    async function refresh() {
        try {
            const res = await App.api.getArchives();
            const data = App.unwrap(res) || [];
            App.table.create({
                container: document.getElementById('tbl'),
                columns: [
                    {key:'name',label:'Name'},
                    {key:'itemType',label:'Type',render:v=>`<span class="badge badge-yellow">${App.fmt.escapeHtml(v||'')}</span>`},
                    {key:'displayName',label:'Display Name'},
                    {key:'archivedAt',label:'Archived'},
                ],
                data,
                actions: [{key:'restore',label:'Restore'},{key:'delete',label:'Delete'}],
                onAction(action, row) {
                    if (action==='restore') restoreItem(row);
                    if (action==='delete') deleteItem(row);
                },
                searchable: true,
                emptyMessage: 'No archived items'
            });
        } catch(e) { App.notify.error('Failed: '+e.message); }
    }
    async function restoreItem(row) {
        App.modal.confirm({title:'Restore',message:`Restore "${row.name}" (${row.itemType})?`,danger:false,
            onConfirm: async () => { await App.api.restoreArchive(row.id); App.notify.success('Restored'); await refresh(); }
        });
    }
    async function deleteItem(row) {
        App.modal.confirm({title:'Delete Permanently',message:`Permanently delete "${row.name}"? This action cannot be undone.`,danger:true,
            onConfirm: async () => { await App.api.deleteArchive(row.id); App.notify.success('Deleted'); await refresh(); }
        });
    }
};
})();
