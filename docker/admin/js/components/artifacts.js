window.App = window.App || {};
window.App.pages = window.App.pages || {};
(function(){
'use strict';
App.pages.artifacts = async function(container) {
    App.layout.setTitle('Artifacts');
    container.innerHTML = `<div class="btn-group" style="margin-bottom:16px">
        <button class="btn btn-accent" id="btn-new">+ New Artifact</button>
        <button class="btn btn-outline" id="btn-sync-all">Sync All</button>
    </div><div id="tbl"></div>`;
    document.getElementById('btn-new').onclick = () => showEdit(null);
    document.getElementById('btn-sync-all').onclick = async () => {
        try { await App.api.syncArtifacts(); App.notify.success('Sync started'); await refresh(); }
        catch(e) { App.notify.error('Sync failed: '+e.message); }
    };
    await refresh();
    async function refresh() {
        try {
            const res = await App.api.getArtifacts();
            const data = App.unwrap(res) || [];
            App.table.create({
                container: document.getElementById('tbl'),
                columns: [
                    {key:'name',label:'Name'},
                    {key:'type',label:'Type',render:v=>`<span class="badge badge-blue">${App.fmt.escapeHtml(v||'')}</span>`},
                    {key:'source',label:'Source'},
                    {key:'platform',label:'Platform',render:v=>`<span class="badge badge-green">${App.fmt.escapeHtml(v||'JSON')}</span>`},
                    {key:'sync',label:'Sync',render:v=>v?`<span class="badge badge-green">ON</span>`:`<span class="badge badge-yellow">OFF</span>`},
                    {key:'updated',label:'Updated'},
                ],
                data,
                actions: [{key:'edit',label:'Edit'},{key:'sync',label:'Sync'},{key:'delete',label:'Delete'}],
                onAction(action, row) {
                    if (action==='edit') showEdit(row);
                    if (action==='sync') syncOne(row);
                    if (action==='delete') deleteItem(row);
                },
                searchable: true,
                emptyMessage: 'No artifacts yet'
            });
        } catch(e) { App.notify.error('Failed: '+e.message); }
    }
    function showEdit(row) {
        const fields = ['name','type','source','platform','sync','includeUnsupportedProxy','prettyYaml'];
        const vals = row||{};
        const body = fields.map(f => {
            if (f==='type') return `<div class="form-group"><label>Type</label><select id="f_${f}"><option value="subscription" ${vals[f]==='subscription'?'selected':''}>Subscription</option><option value="collection" ${vals[f]==='collection'?'selected':''}>Collection</option><option value="file" ${vals[f]==='file'?'selected':''}>File</option><option value="rule" ${vals[f]==='rule'?'selected':''}>Rule</option></select></div>`;
            if (f==='platform') return `<div class="form-group"><label>Platform</label><select id="f_${f}"><option value="JSON" ${vals[f]==='JSON'?'selected':''}>JSON</option><option value="Clash" ${vals[f]==='Clash'?'selected':''}>Clash</option><option value="Surge" ${vals[f]==='Surge'?'selected':''}>Surge</option><option value="Loon" ${vals[f]==='Loon'?'selected':''}>Loon</option><option value="QX" ${vals[f]==='QX'?'selected':''}>QX</option><option value="SurgeMac" ${vals[f]==='SurgeMac'?'selected':''}>SurgeMac</option></select></div>`;
            if (f==='sync'||f==='includeUnsupportedProxy'||f==='prettyYaml') return `<div class="form-group"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="f_${f}" ${vals[f]?'checked':''} style="width:auto"> ${f}</label></div>`;
            return `<div class="form-group"><label>${f}</label><input id="f_${f}" value="${App.fmt.escapeHtml(vals[f]||'')}">`;
        }).join('');
        App.modal.show({
            title: row?'Edit Artifact':'New Artifact', size:'lg', body,
            onSave: async (ov) => {
                const data = {};
                fields.forEach(f => {
                    const el=ov.querySelector('#f_'+f);
                    if(!el) return;
                    if(el.type==='checkbox') data[f]=el.checked;
                    else data[f]=el.value;
                });
                if (!data.name) throw new Error('Name is required');
                if (row) { const res=await App.api.updateArtifact(row.name,data); App.unwrap(res); }
                else { const res=await App.api.createArtifact(data); App.unwrap(res); }
                App.notify.success(row?'Updated':'Created');
                await refresh();
            }
        });
    }
    async function syncOne(row) {
        try { await App.api.syncArtifact(row.name); App.notify.success('Synced'); await refresh(); }
        catch(e) { App.notify.error('Sync failed: '+e.message); }
    }
    async function deleteItem(row) {
        App.modal.confirm({title:'Delete Artifact',message:`Delete "${row.name}"?`,danger:true,
            onConfirm: async () => { await App.api.deleteArtifact(row.name); App.notify.success('Deleted'); await refresh(); }
        });
    }
};
})();
