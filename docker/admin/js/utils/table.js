window.App = window.App || {};
(function(){
'use strict';
App.table = {
    create({container, columns, data, actions, onAction, searchable, emptyMessage}) {
        container.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';

        if (searchable) {
            const sb = document.createElement('div');
            sb.className = 'search-bar';
            sb.innerHTML = '<input type="text" placeholder="Search...">';
            const inp = sb.querySelector('input');
            inp.addEventListener('input', () => this._render(wrap, columns, data, actions, onAction, inp.value.trim().toLowerCase(), emptyMessage));
            container.appendChild(sb);
        }

        container.appendChild(wrap);
        this._render(wrap, columns, data, actions, onAction, '', emptyMessage);
    },
    _render(wrap, columns, data, actions, onAction, query, emptyMsg) {
        let rows = data||[];
        if (query) rows = rows.filter(r => columns.some(c => String(r[c.key]||'').toLowerCase().includes(query)));
        if (!rows.length) { wrap.innerHTML = `<div class="empty"><div class="empty-ico">&#128269;</div><p>${emptyMsg||'No items found'}</p></div>`; return; }

        let html = '<table><thead><tr>';
        columns.forEach(c => { html += `<th data-sort="${c.key}">${App.fmt.escapeHtml(c.label||c.key)}</th>`; });
        if (actions) html += '<th style="width:1%">Actions</th>';
        html += '</tr></thead><tbody>';
        rows.forEach((r,i) => {
            html += '<tr>';
            columns.forEach(c => {
                let v = r[c.key];
                if (c.render) v = c.render(v, r);
                else if (v === undefined || v === null) v = '-';
                else if (typeof v === 'number' && c.key.includes('At')) v = App.fmt.ago(v);
                else v = App.fmt.truncate(String(v), c.truncate||80);
                html += `<td>${v}</td>`;
            });
            if (actions) {
                html += '<td><div class="btn-group">';
                actions.forEach(a => {
                    html += `<button class="btn btn-sm btn-outline" data-action="${a.key}" data-idx="${i}">${App.fmt.escapeHtml(a.label)}</button>`;
                });
                html += '</div></td>';
            }
            html += '</tr>';
        });
        html += '</tbody></table>';
        wrap.innerHTML = html;

        // Sort
        wrap.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const key = th.dataset.sort;
                const dir = th.dataset.dir === 'asc' ? 'desc' : 'asc';
                th.dataset.dir = dir;
                rows.sort((a,b) => {
                    let va=a[key], vb=b[key];
                    if (typeof va==='string') va=va.toLowerCase(),vb=String(vb||'').toLowerCase();
                    return (va<vb?-1:(va>vb?1:0))*(dir==='asc'?1:-1);
                });
                this._render(wrap, columns, rows, actions, onAction, query, emptyMsg);
            });
        });

        // Actions
        if (actions && onAction) {
            wrap.querySelectorAll('button[data-action]').forEach(btn => {
                btn.addEventListener('click', () => onAction(btn.dataset.action, rows[parseInt(btn.dataset.idx)]));
            });
        }
    },
};
})();
