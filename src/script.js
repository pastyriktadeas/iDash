let appData = { background: '', services: [] };
let isEditing = false;
let activeFolderId = null; 
let sortableMain = null;
let sortableFolder = null;
let ctxTargetItem = null;

// --- HAPTICS ---
function triggerHaptic() {
    if (navigator.vibrate) navigator.vibrate(15);
}

// --- SMART GREETING ---
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";
    document.getElementById('searchInput').placeholder = `${greeting}, search...`;
}

// --- ESCAPE KEY & "/" SHORTCUT ---
document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault(); document.getElementById('searchInput').focus();
    }
    if (e.key === 'Escape') {
        if (document.getElementById('modal').style.display === 'flex') closeModal();
        else if (document.getElementById('bgModal').style.display === 'flex') closeBgModal();
        else if (document.getElementById('contextMenu').classList.contains('active')) hideContextMenu();
        else if (activeFolderId) closeFolder();
        else if (isEditing) toggleEdit();
        document.getElementById('searchInput').blur();
        document.getElementById('searchInput').value = '';
        handleSearchInput({target: {value: ''}});
    }
});

// --- SPOTLIGHT SEARCH ---
function handleSearchInput(e) {
    const val = e.target.value.toLowerCase();
    const items = document.querySelectorAll('#grid .app-item');
    items.forEach(el => {
        if(el.classList.contains('add-btn')) return;
        const title = el.querySelector('span').innerText.toLowerCase();
        el.style.display = title.includes(val) ? 'flex' : 'none';
    });
}

function handleSearch(e) {
    if (e.key === 'Enter' && e.target.value) {
        const val = e.target.value;
        const visibleItems = Array.from(document.querySelectorAll('#grid .app-item')).filter(el => el.style.display !== 'none' && !el.classList.contains('add-btn'));
        
        if (visibleItems.length === 1) {
            visibleItems[0].click(); 
            e.target.value = ''; handleSearchInput({target: {value: ''}});
        } else {
            window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(val); 
        }
    }
}

// --- CONTEXT MENU ---
document.addEventListener('click', hideContextMenu);
function hideContextMenu() { document.getElementById('contextMenu').classList.remove('active'); }

function showContextMenu(e, item) {
    if(isEditing) return;
    e.preventDefault(); triggerHaptic();
    ctxTargetItem = item;
    const menu = document.getElementById('contextMenu');
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.classList.add('active');
}

document.getElementById('ctxOpen').onclick = () => {
    if(ctxTargetItem.type === 'folder') openFolder(ctxTargetItem.id); else window.open(ctxTargetItem.url, '_blank');
};
document.getElementById('ctxEdit').onclick = () => openModal(ctxTargetItem);
document.getElementById('ctxDelete').onclick = () => deleteItem(null, ctxTargetItem.id);

// --- MAIN LOGIC ---
async function loadData() {
    updateGreeting();
    try {
        const response = await fetch('data.json?t=' + new Date().getTime());
        if (!response.ok) throw new Error("Data fail");
        const json = await response.json();
        if (Array.isArray(json)) { appData.services = json; saveDataToServer(); } else { appData = json; }
    } catch (e) { 
        alert("Error: Failed to load data from server! Please check permissions."); return; 
    }
    if(!appData.background) appData.background = 'https://wallpapercave.com/wp/wp12572002.jpg';
    applyBackground(appData.background); render();
}

function applyBackground(url) {
    const img = new Image(); img.src = url; img.onload = () => { document.body.style.backgroundImage = `url('${url}')`; };
}

function createItemHTML(item) {
    let html = `<div class="delete-badge" onclick="deleteItem(event, ${item.id})"></div>`;
    if (item.type === 'folder') {
        html += `<div class="folder-icon">`;
        const items = item.items || [];
        for(let i=0; i<9; i++) {
            if (items[i]) {
                if(items[i].icon === 'live-calendar') html += `<div class="mini-cal"></div>`;
                else html += `<img src="${items[i].icon || 'https://cdn-icons-png.flaticon.com/512/566/566095.png'}">`;
            } else html += `<div></div>`; 
        }
        html += `</div>`;
    } else {
        const shrinkClass = item.shrink ? 'shrink-icon' : '';
        if (item.icon === 'live-calendar') {
            const now = new Date();
            const dayName = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            html += `<div class="live-calendar-icon ${shrinkClass}"><div class="cal-day">${dayName}</div><div class="cal-date">${now.getDate()}</div></div>`;
        } else {
            const src = item.icon || 'https://cdn-icons-png.flaticon.com/512/566/566095.png';
            html += `<img src="${src}" class="${shrinkClass}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/566/566095.png'">`;
        }
    }
    html += `<span>${item.title}</span>`;
    return html;
}

function render() {
    const grid = document.getElementById('grid');
    const folderGrid = document.getElementById('folderGrid');
    
    grid.innerHTML = '';
    appData.services.forEach(item => {
        const el = document.createElement('div');
        el.className = 'app-item'; el.setAttribute('data-id', item.id);
        el.onclick = (e) => handleItemClick(e, item);
        el.oncontextmenu = (e) => showContextMenu(e, item);
        el.innerHTML = createItemHTML(item);
        grid.appendChild(el);
    });
    appendAddButton(grid);

    if (activeFolderId) {
        folderGrid.innerHTML = '';
        const folder = appData.services.find(s => s.id == activeFolderId);
        if (folder) {
            document.getElementById('folderViewTitle').innerText = folder.title;
            (folder.items || []).forEach(item => {
                const el = document.createElement('div');
                el.className = 'app-item'; el.setAttribute('data-id', item.id);
                el.onclick = (e) => handleItemClick(e, item);
                el.oncontextmenu = (e) => showContextMenu(e, item);
                el.innerHTML = createItemHTML(item);
                folderGrid.appendChild(el);
            });
            appendAddButton(folderGrid);
        }
    }
    initSortable();
}

function appendAddButton(container) {
    if (isEditing || container.children.length === 0) {
        const addBtn = document.createElement('div');
        addBtn.className = 'app-item add-btn';
        if(isEditing) addBtn.classList.add('editing');
        addBtn.onclick = () => openModal();
        addBtn.innerHTML = `<div class="icon-placeholder">+</div><span>Add</span>`;
        container.appendChild(addBtn);
    }
}

function initSortable() {
    const opts = {
        animation: 350, disabled: !isEditing, forceFallback: true, filter: '.add-btn',
        onStart: triggerHaptic, onEnd: function (evt) {
            triggerHaptic();
            const list = activeFolderId ? appData.services.find(s => s.id == activeFolderId).items : appData.services;
            const item = list.splice(evt.oldIndex, 1)[0];
            list.splice(evt.newIndex, 0, item);
            saveDataToServer(); render();
        },
        onMove: (evt) => evt.related.className.indexOf('add-btn') === -1
    };
    if(sortableMain) sortableMain.destroy(); sortableMain = new Sortable(document.getElementById('grid'), opts);
    if(sortableFolder) sortableFolder.destroy(); sortableFolder = new Sortable(document.getElementById('folderGrid'), opts);
}

function toggleEdit() {
    isEditing = !isEditing; triggerHaptic();
    document.getElementById('grid').classList.toggle('editing', isEditing);
    document.getElementById('folderGrid').classList.toggle('editing', isEditing);
    document.querySelector('.top-actions').classList.toggle('editing-mode', isEditing);
    const btn = document.getElementById('editBtn');
    if (isEditing) { btn.classList.add('active'); btn.innerText = 'Done'; } else { btn.classList.remove('active'); btn.innerText = 'Edit'; }
    render();
}

function handleItemClick(e, item) {
    if (e.target.classList.contains('delete-badge')) return;
    triggerHaptic();
    if (isEditing) openModal(item);
    else if (item.type === 'folder') openFolder(item.id);
    else window.open(item.url, '_blank');
}

function openFolder(id) { activeFolderId = id; render(); document.getElementById('folderView').classList.add('active'); }
function closeFolder() { activeFolderId = null; document.getElementById('folderView').classList.remove('active'); render(); }

async function saveDataToServer() {
    try {
        const res = await fetch('save.php', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(appData) });
        if (!res.ok) alert("Error saving data!");
    } catch(e) { console.error(e); }
}

async function deleteItem(event, id) {
    if(event) event.stopPropagation();
    if(!confirm("Are you sure you want to delete this?")) return;
    
    if (activeFolderId) {
        let folder = appData.services.find(s => s.id == activeFolderId);
        folder.items = folder.items.filter(s => s.id !== id);
    } else {
        appData.services = appData.services.filter(s => s.id !== id);
    }
    await saveDataToServer(); render();
}

function openModal(item = null) {
    const isFolderLvl = activeFolderId !== null;
    document.getElementById('folderTypeWrapper').style.display = isFolderLvl ? 'none' : 'flex';

    if (item) {
        document.getElementById('modalTitle').innerText = "Edit Item";
        document.getElementById('inpId').value = item.id;
        document.getElementById('inpTitle').value = item.title;
        document.getElementById('inpIsFolder').checked = item.type === 'folder';
        if(item.type !== 'folder') {
            document.getElementById('inpUrl').value = item.url;
            document.getElementById('inpIcon').value = item.icon;
            document.getElementById('inpShrink').checked = item.shrink === true;
        }
    } else {
        document.getElementById('modalTitle').innerText = "Add New";
        document.getElementById('inpId').value = ""; document.getElementById('inpTitle').value = "";
        document.getElementById('inpUrl').value = ""; document.getElementById('inpIcon').value = "";
        document.getElementById('inpShrink').checked = false; document.getElementById('inpIsFolder').checked = false;
    }
    toggleFolderInputs(); document.getElementById('modal').style.display = 'flex';
}

function toggleFolderInputs() {
    const isFolder = document.getElementById('inpIsFolder').checked;
    document.getElementById('linkInputs').style.display = isFolder ? 'none' : 'block';
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

async function saveItem() {
    const id = document.getElementById('inpId').value;
    const title = document.getElementById('inpTitle').value;
    const isFolder = document.getElementById('inpIsFolder').checked;
    if(!title) return alert("Please enter a title");

    let targetArray = activeFolderId ? appData.services.find(s => s.id == activeFolderId).items : appData.services;
    const newItem = { id: id ? Number(id) : Date.now(), title: title, type: isFolder ? 'folder' : 'link' };
    
    if (isFolder) { newItem.items = []; } 
    else {
        newItem.url = document.getElementById('inpUrl').value;
        newItem.icon = document.getElementById('inpIcon').value;
        newItem.shrink = document.getElementById('inpShrink').checked;
    }

    if (id) {
        const index = targetArray.findIndex(s => s.id == id);
        if (isFolder) newItem.items = targetArray[index].items || [];
        targetArray[index] = newItem;
    } else { targetArray.push(newItem); }

    await saveDataToServer(); closeModal(); render();
}

function openBgModal() { document.getElementById('inpBgUrl').value = appData.background; document.getElementById('bgModal').style.display = 'flex'; }
function closeBgModal() { document.getElementById('bgModal').style.display = 'none'; }
async function saveBackground() {
    const val = document.getElementById('inpBgUrl').value;
    if(val) { appData.background = val; applyBackground(val); await saveDataToServer(); }
    closeBgModal();
}

loadData();