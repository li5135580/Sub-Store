window.App = window.App || {};
(function(){
'use strict';
App.modal = {
    show({title, body, onSave, saveLabel, danger, size}) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const sz = size==='lg'?'modal-lg':(size==='sm'?'modal-sm':'');
        overlay.innerHTML = `<div class="modal ${sz}">
            <div class="modal-header"><h3>${App.fmt.escapeHtml(title||'')}</h3><button class="close">&times;</button></div>
            <div class="modal-body">${body||''}</div>
            <div class="modal-footer">
                <button class="btn btn-outline cancel">Cancel</button>
                ${onSave?`<button class="btn ${danger?'btn-danger':'btn-accent'} save">${saveLabel||'Save'}</button>`:''}
            </div>
        </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('.close').onclick = () => overlay.remove();
        overlay.querySelector('.cancel').onclick = () => overlay.remove();
        overlay.addEventListener('click',e => { if(e.target===overlay) overlay.remove(); });
        if(onSave) overlay.querySelector('.save').onclick = async () => {
            try { await onSave(overlay); overlay.remove(); } catch(e) { App.notify.error(e.message); }
        };
        return overlay;
    },
    confirm({title, message, onConfirm, danger}) {
        return this.show({ title, body:`<p>${App.fmt.escapeHtml(message)}</p>`, saveLabel:'Confirm', danger, size:'sm', onSave: async (ov) => { await onConfirm(); } });
    },
    getEl(overlay, sel) { return overlay.querySelector(sel); },
    getVal(overlay, sel) { return (overlay.querySelector(sel)||{}).value; },
};
})();
