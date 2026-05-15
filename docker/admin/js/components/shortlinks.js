window.App = window.App || {};
window.App.pages = window.App.pages || {};
(function(){
'use strict';
App.pages.shortlinks = async function(container) {
    App.layout.setTitle('Short Links');
    container.innerHTML = '<div class="btn-group" style="margin-bottom:16px"><button class="btn btn-accent" id="btn-new">+ New Short Link</button></div><div id="tbl"></div>';
    document.getElementById('btn-new').onclick = () => showCreate();
    await refresh();
    async function refresh() {
        try {
            const res = await App.api.getShortlinks();
            const data = App.unwrap(res) || [];
            App.table.create({
                container: document.getElementById('tbl'),
                columns: [
                    {key:'code',label:'Code',render:v=>`<code class="mono" style="color:var(--accent)">${App.fmt.escapeHtml(v)}</code>`},
                    {key:'type',label:'Type',render:v=>`<span class="badge badge-blue">${App.fmt.escapeHtml(v||'')}</span>`},
                    {key:'name',label:'Name'},
                    {key:'target',label:'Target',render:v=>v||'-'},
                    {key:'query',label:'Query',render:v=>v||'-'},
                    {key:'createdAt',label:'Created'},
                ],
                data,
                actions: [{key:'copy',label:'Copy URL'},{key:'delete',label:'Delete'}],
                onAction(action, row) {
                    if (action==='copy') {
                        const url = location.origin + App.config.shortlinkPrefix + '/' + row.code;
                        navigator.clipboard.writeText(url).then(() => App.notify.success('Copied: '+url)).catch(() => App.notify.warning('Copy failed, URL: '+url));
                    }
                    if (action==='delete') deleteItem(row);
                },
                searchable: true,
                emptyMessage: 'No short links yet'
            });
        } catch(e) { App.notify.error('Failed: '+e.message); }
    }
    function showCreate() {
        const body = `
            <div class="form-group"><label>Type</label><select id="f_type"><option value="sub">Subscription</option><option value="col">Collection</option><option value="file">File</option></select></div>
            <div class="form-group"><label>Name (subscription/collection/file name)</label><input id="f_name" placeholder="e.g. MySubscription"></div>
            <div class="form-group"><label>Target Platform (optional)</label><input id="f_target" placeholder="e.g. Clash, Surge, JSON"></div>
            <div class="form-group"><label>Query String (optional)</label><input id="f_query" placeholder="e.g. flag=clash&proxy=myproxy"></div>
            <div class="form-group"><label>Custom Code (optional, auto-generated if blank)</label><input id="f_code" placeholder="Leave empty for random 6-char code"></div>`;
        App.modal.show({
            title:'New Short Link', body,
            onSave: async (ov) => {
                const data = {
                    type: App.modal.getVal(ov,'#f_type'),
                    name: App.modal.getVal(ov,'#f_name'),
                    target: App.modal.getVal(ov,'#f_target'),
                    query: App.modal.getVal(ov,'#f_query'),
                    code: App.modal.getVal(ov,'#f_code')||undefined,
                };
                if (!data.name) throw new Error('Name is required');
                await App.api.createShortlink(data);
                App.notify.success('Created');
                await refresh();
            }
        });
    }
    async function deleteItem(row) {
        App.modal.confirm({title:'Delete Short Link',message:`Delete short link "/${row.code}"?`,danger:true,
            onConfirm: async () => { await App.api.deleteShortlink(row.code); App.notify.success('Deleted'); await refresh(); }
        });
    }
};
})();
