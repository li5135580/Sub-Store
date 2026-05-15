window.App = window.App || {};
window.App.pages = window.App.pages || {};
(function(){
'use strict';
App.pages.tokens = async function(container) {
    App.layout.setTitle('Tokens');
    container.innerHTML = '<div class="btn-group" style="margin-bottom:16px"><button class="btn btn-accent" id="btn-new">+ New Token</button></div><div id="tbl"></div>';
    document.getElementById('btn-new').onclick = () => showCreate();
    await refresh();
    async function refresh() {
        try {
            const res = await App.api.getTokens();
            const data = App.unwrap(res) || [];
            App.table.create({
                container: document.getElementById('tbl'),
                columns: [
                    {key:'token',label:'Token',render:v=>`<code class="mono">${App.fmt.maskToken(v)}</code>`},
                    {key:'type',label:'Type',render:v=>`<span class="badge badge-blue">${App.fmt.escapeHtml(v||'')}</span>`},
                    {key:'name',label:'Name'},
                    {key:'mode',label:'Mode',render:v=>v||'-'},
                    {key:'exp',label:'Expires'},
                ],
                data,
                actions: [{key:'delete',label:'Delete'}],
                onAction(action, row) { if (action==='delete') deleteItem(row); },
                searchable: true,
                emptyMessage: 'No tokens yet'
            });
        } catch(e) { App.notify.error('Failed: '+e.message); }
    }
    function showCreate() {
        const body = `
            <div class="form-group"><label>Type</label><select id="f_type"><option value="sub">Subscription (sub)</option><option value="col">Collection (col)</option><option value="file">File</option></select></div>
            <div class="form-group"><label>Name (of the resource to share)</label><input id="f_name" placeholder="e.g. MySubscription"></div>
            <div class="form-group"><label>Custom Token (optional, auto-generated if blank)</label><input id="f_token" placeholder="Leave empty for auto"></div>
            <div class="form-group"><label>Expiry Mode</label><select id="f_mode"><option value="">No expiry</option><option value="duration">Duration</option><option value="datetime">Date/Time</option></select></div>
            <div class="form-group" id="g_dur" style="display:none"><label>Duration (e.g. 7d, 30d, 1h)</label><input id="f_expiresIn" placeholder="7d"></div>
            <div class="form-group" id="g_dt" style="display:none"><label>Expiry Date</label><input id="f_exp" type="datetime-local"></div>`;
        App.modal.show({
            title:'New Token', body,
            onSave: async (ov) => {
                const data = {payload:{},options:{}};
                data.payload.type = App.modal.getVal(ov,'#f_type');
                data.payload.name = App.modal.getVal(ov,'#f_name');
                const tok = App.modal.getVal(ov,'#f_token');
                if (tok) data.payload.token = tok;
                const mode = App.modal.getVal(ov,'#f_mode');
                if (mode==='duration') {
                    data.options.mode = 'duration';
                    data.options.expiresIn = App.modal.getVal(ov,'#f_expiresIn');
                } else if (mode==='datetime') {
                    data.options.mode = 'datetime';
                    const dt = App.modal.getVal(ov,'#f_exp');
                    if (dt) data.options.exp = new Date(dt).getTime();
                }
                const res = await App.api.createToken(data);
                App.unwrap(res);
                App.notify.success('Token created');
                await refresh();
            }
        });
        const modeSel = document.getElementById('f_mode');
        if (modeSel) modeSel.onchange = function() {
            document.getElementById('g_dur').style.display = this.value==='duration'?'block':'none';
            document.getElementById('g_dt').style.display = this.value==='datetime'?'block':'none';
        };
    }
    async function deleteItem(row) {
        App.modal.confirm({title:'Delete Token',message:`Delete token for "${row.name}"?`,danger:true,
            onConfirm: async () => { await App.api.deleteToken(row.token, row.type, row.name); App.notify.success('Deleted'); await refresh(); }
        });
    }
};
})();
