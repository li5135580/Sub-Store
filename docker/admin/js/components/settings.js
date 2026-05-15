window.App = window.App || {};
window.App.pages = window.App.pages || {};
(function(){
'use strict';
App.pages.settings = async function(container) {
    App.layout.setTitle('Settings');
    container.innerHTML = '<div style="margin-bottom:16px"><button class="btn btn-accent" id="btn-edit">Edit Settings</button></div><div id="settings-view" class="json-viewer">Loading...</div>';
    await load();
    async function load() {
        try {
            const res = await App.api.getSettings();
            const data = App.unwrap(res);
            document.getElementById('settings-view').textContent = JSON.stringify(data, null, 2);
        } catch(e) { document.getElementById('settings-view').textContent = 'Error: '+e.message; }
    }
    document.getElementById('btn-edit').onclick = () => {
        const current = document.getElementById('settings-view').textContent;
        const body = `<div class="form-group"><label>Settings JSON</label><textarea id="f_content" rows="20" class="mono">${App.fmt.escapeHtml(current)}</textarea></div>
            <p class="muted">Edit the JSON object above and save. Invalid JSON will be rejected.</p>`;
        App.modal.show({
            title:'Edit Settings', size:'lg', body,
            onSave: async (ov) => {
                const raw = App.modal.getVal(ov,'#f_content');
                let data;
                try { data = JSON.parse(raw); } catch(e) { throw new Error('Invalid JSON: '+e.message); }
                const res = await App.api.updateSettings(data);
                App.unwrap(res);
                App.notify.success('Settings updated');
                await load();
            }
        });
    };
};
})();
