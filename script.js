
document.addEventListener('DOMContentLoaded', () => {
    /* state variables */
    let appData = [];
    let currentCategory = null;
    let adminMode = false;
    let editingItemId = null; // null represents adding mode
    let editingCategoryId = null; // for category modal

    /* Supabase & Auth State */
    let supabaseClient = null; // Renamed from supabase to avoid shadowing
    let currentUser = null;
    const DB_TABLE = 'app_config';
    const DB_KEY = 'nav_data';

    /* DOM elements */
    const navMenu = document.getElementById('nav-menu');
    const contentWrapper = document.getElementById('content-wrapper');
    const searchInput = document.getElementById('search-input');

    // Admin Controls
    const btnToggleAdmin = document.getElementById('toggle-admin');
    const adminActions = document.getElementById('admin-actions');
    const btnAdd = document.getElementById('btn-add');
    const btnExport = document.getElementById('btn-export');

    // Item Modal
    const itemModal = document.getElementById('item-modal');
    const itemModalClose = document.getElementById('modal-close');
    const itemModalCancel = document.getElementById('modal-cancel');
    const itemForm = document.getElementById('item-form');
    const modalTitle = document.getElementById('modal-title');

    // Category Modal
    const catModal = document.getElementById('category-modal');
    const catModalClose = document.getElementById('cat-modal-close');
    const catModalCancel = document.getElementById('cat-modal-cancel');
    const catForm = document.getElementById('cat-form');
    const catModalTitle = document.getElementById('cat-modal-title');
    const catInputName = document.getElementById('cat-input-name');
    const catInputIcon = document.getElementById('cat-input-icon');
    const catIconGroup = document.getElementById('cat-icon-group');
    const catIdField = document.getElementById('cat-id');
    const catLevelField = document.getElementById('cat-level');
    const catParentIdField = document.getElementById('cat-parent-id');

    // Item Form Inputs
    const inputTitle = document.getElementById('input-title');
    const inputUrl = document.getElementById('input-url');
    const inputDesc = document.getElementById('input-desc');
    const inputLogo = document.getElementById('input-logo');
    const inputCategory = document.getElementById('input-category');
    const inputSubCategory = document.getElementById('input-subcategory');
    const subCategoryList = document.getElementById('subcategory-list');

    // Login Modal Elements
    const loginModal = document.getElementById('login-modal');
    const loginEmail = document.getElementById('login-email');
    const loginPass = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn-submit');
    const loginError = document.getElementById('login-error');
    const loginClose = document.getElementById('login-modal-close');
    const userInfoDisplay = document.getElementById('user-info');

    /* === Initialization === */

    async function init() {
        // 1. Init Supabase
        // Access global 'supabase' object from CDN
        // Note: The global object is window.supabase.
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
             try {
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            } catch (e) {
                console.error('Supabase init error:', e);
            }
        } else {
            console.error('Supabase global object not found. Script might not be loaded.');
        }

        // 2. Check Auth Session
        if (supabaseClient) {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                currentUser = session.user;
                updateUserUI();
            }
            
            // Listen for auth changes
            supabaseClient.auth.onAuthStateChange((_event, session) => {
                currentUser = session?.user || null;
                updateUserUI();
            });
        }

        // 3. Load Data (Remote First, then Local)
        await loadData();

        // 4. Normalize
        normalizeData();

        // 5. Initial Category
        if (appData.length > 0) {
            currentCategory = appData[0];
        }

        // 6. Render
        renderSidebar();
        renderMain();
    }
    
    async function loadData() {
        let loaded = false;
        
        // Try loading from Supabase
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from(DB_TABLE)
                    .select('value')
                    .eq('key', DB_KEY)
                    .single();
                
                if (data && data.value) {
                    appData = data.value;
                    localStorage.setItem('myNavData', JSON.stringify(appData));
                    loaded = true;
                    console.log('Loaded data from Supabase');
                }
            } catch (err) {
                console.warn('Failed to load from Supabase:', err);
            }
        }

        // Fallback to LocalStorage
        if (!loaded) {
            const localData = localStorage.getItem('myNavData');
            if (localData) {
                appData = JSON.parse(localData);
                // loaded = true; // Comment out this to allow fallback to data.js if local data is empty or user wants to reset
                 // Actually, if localData exists but is empty array, we might want to load default data.
                 if (appData.length > 0) loaded = true;
                console.log('Loaded data from LocalStorage');
            }
        }

        // Fallback to static data.js
        if (!loaded) {
            appData = JSON.parse(JSON.stringify(navData));
            console.log('Loaded data from static data.js');
        }
    }

    function updateUserUI() {
        if (currentUser) {
            userInfoDisplay.innerHTML = `${currentUser.email} <a href="#" id="logout-link" style="margin-left:8px;color:var(--primary-color);">退出</a>`;
            userInfoDisplay.classList.remove('hidden');
            
            // Auto enable admin mode on login
            if (!adminMode) {
                 adminMode = true;
                 toggleAdminModeUI();
            }

            // Bind logout
            document.getElementById('logout-link').onclick = (e) => {
                e.preventDefault();
                handleLogout();
            };
        } else {
            userInfoDisplay.classList.add('hidden');
            if (adminMode) {
                adminMode = false;
                toggleAdminModeUI();
            }
        }
    }

    async function handleLogin() {
        const email = loginEmail.value;
        const password = loginPass.value;
        
        if (!email || !password) return;
        
        loginBtn.disabled = true;
        loginBtn.textContent = '登录中...';
        loginError.classList.add('hidden');

        try {
            if (!supabaseClient) throw new Error('Supabase client not initialized');

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Success
            loginModal.classList.add('hidden');
            loginPass.value = '';
            
            // Reload data to ensure we have latest version for editing
            await loadData();
            normalizeData(); // Re-normalize after reload
            renderSidebar();
            renderMain();
            
            // Auto enable admin mode
            adminMode = true;
            toggleAdminModeUI();

        } catch (err) {
            console.error(err);
            loginError.textContent = '登录失败: ' + err.message;
            loginError.classList.remove('hidden');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = '登录';
        }
    }

    async function handleLogout() {
        if (supabaseClient) await supabaseClient.auth.signOut();
        // UI updates automatically via onAuthStateChange
    }

    function normalizeData() {
        appData.forEach(cat => {
            if (!cat.id) cat.id = generateId();
            cat.items.forEach(sub => {
                // Subcategories don't strictly need IDs in this simple model as we use name match, 
                // but let's use IDs if we were robust. For now, name is key.
                if (!sub.id) sub.id = generateId();
                sub.items.forEach(item => {
                    if (!item._id) item._id = generateId();
                });
            });
        });
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    async function saveData() {
        localStorage.setItem('myNavData', JSON.stringify(appData));
        renderSidebar(); // Sidebar updates often affect main content too
        renderMain();

        // Save Remote if logged in
        if (currentUser && supabaseClient) {
             const btnText = btnAdd.innerHTML; // Hacky way to show status? No, better use console or unobtrusive notification
             console.log('Syncing to Supabase...');
             try {
                // Use upsert instead of update to handle case where record doesn't exist yet
                const { error } = await supabaseClient
                    .from(DB_TABLE)
                    .upsert({ key: DB_KEY, value: appData }, { onConflict: 'key' });
                
                if (error) throw error;
                console.log('Saved to Supabase successfully');
                alert('保存成功！数据已同步到 Supabase 云端。');
            } catch (err) {
                console.error('Failed to save to Supabase:', err);
                let msg = err.message;
                if (msg === 'Failed to fetch') {
                    msg = '网络请求失败 (Failed to fetch)。\n请检查：\n1. 网络连接是否正常\n2. 是否需要开启代理 (Supabase 在国内可能不稳定)\n3. 数据库表 app_config 是否已创建';
                }
                alert('保存到云端失败，仅保存到本地。\n' + msg);
            }
        }
    }

    /* === Rendering === */

    function renderSidebar() {
        navMenu.innerHTML = '';

        appData.forEach(cat => {
            const div = document.createElement('div');
            // Using div wrapper to handle positioning if needed, actually anchor is fine
            // We need to inject actions inside the anchor

            const isActive = currentCategory && currentCategory.id === cat.id;

            let actionsHtml = '';
            if (adminMode) {
                actionsHtml = `
                    <div class="sidebar-actions">
                         <button class="btn-sidebar-action edit" data-id="${cat.id}"><i class="ti ti-pencil"></i></button>
                         <button class="btn-sidebar-action delete" data-id="${cat.id}"><i class="ti ti-trash"></i></button>
                    </div>
                `;
            }

            const a = document.createElement('a');
            a.href = `#${cat.id}`;
            a.className = `nav-item ${isActive ? 'active' : ''}`;
            a.dataset.id = cat.id;
            a.innerHTML = `
                <div style="display:flex;align-items:center;gap:0.75rem;flex:1;min-width:0;">
                    <i class="${cat.icon}"></i>
                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cat.category}</span>
                </div>
                ${actionsHtml}
            `;

            // Event Delegation for buttons
            a.addEventListener('click', (e) => {
                // Check if clicked on action button
                if (e.target.closest('.btn-sidebar-action')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const btn = e.target.closest('.btn-sidebar-action');
                    if (btn.classList.contains('edit')) openCategoryModal(1, cat.id);
                    if (btn.classList.contains('delete')) deleteCategory(cat.id);
                    return;
                }

                e.preventDefault();
                currentCategory = cat;
                renderSidebar(); // re-render to update active state
                searchInput.value = '';
                renderMain();
                window.scrollTo({ top: 0, behavior: 'instant' });
            });

            navMenu.appendChild(a);
        });

        // Sidebar Add Button
        if (adminMode) {
            const addBtn = document.createElement('button');
            addBtn.className = 'sidebar-add-btn';
            addBtn.innerHTML = '<i class="ti ti-plus"></i> 新增分类';
            addBtn.onclick = () => openCategoryModal(1);
            navMenu.appendChild(addBtn);
        }
    }

    function renderMain(dataOverride = null) {
        let dataToShow = [];
        if (dataOverride) {
            dataToShow = dataOverride;
        } else if (currentCategory) {
            // Find fresh reference from appData in case of updates
            const freshCat = appData.find(c => c.id === currentCategory.id);
            if (freshCat) dataToShow = [freshCat];
        }

        if (!dataToShow || dataToShow.length === 0) {
            contentWrapper.innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding:2rem;">暂无数据</div>`;
            return;
        }

        contentWrapper.innerHTML = dataToShow.map(cat => `
            <section class="category-section">
                <h2 class="category-title">
                    <i class="${cat.icon}"></i> ${cat.category}
                </h2>
                ${renderSubCategories(cat)}
                ${adminMode ? `<button class="sub-add-btn" onclick="document.dispatchEvent(new CustomEvent('addSub', {detail: '${cat.id}'}))"><i class="ti ti-plus"></i> 新增二级分类</button>` : ''}
            </section>
        `).join('');

        // Attach listeners for dynamic elements
        if (adminMode) {
            attachMainClickListeners();
        }
    }

    function renderSubCategories(cat) {
        return cat.items.map(sub => `
            <div class="sub-category">
                <div class="subcategory-header">
                    <h3 class="sub-category-title">${sub.name}</h3>
                    <div class="sub-actions">
                         <button class="btn-sub-action edit" data-cat-id="${cat.id}" data-sub-id="${sub.id}"><i class="ti ti-pencil"></i></button>
                         <button class="btn-sub-action delete" data-cat-id="${cat.id}" data-sub-id="${sub.id}"><i class="ti ti-trash"></i></button>
                    </div>
                </div>
                <div class="card-grid">
                    ${sub.items.map(item => createCardHTML(item)).join('')}
                </div>
            </div>
        `).join('');
    }

    function createCardHTML(item) {
        const logoSrc = getLogoSrc(item);
        const fallbackChar = item.title ? item.title[0] : '#';

        let actionsHtml = '';
        if (adminMode) {
            actionsHtml = `
                <div class="card-actions">
                    <button class="btn-card-action edit" data-id="${item._id}" title="编辑"><i class="ti ti-pencil"></i></button>
                    <button class="btn-card-action delete" data-id="${item._id}" title="删除"><i class="ti ti-trash"></i></button>
                </div>
            `;
        }

        const href = adminMode ? 'javascript:void(0)' : item.url;
        const target = adminMode ? '' : '_blank';
        const cardClass = adminMode ? 'card admin-mode-card' : 'card';

        return `
            <a href="${href}" target="${target}" class="${cardClass}">
                ${actionsHtml}
                <div class="card-logo">
                    ${logoSrc
                ? `<img src="${logoSrc}" alt="${item.title}" onerror="this.onerror=null;this.parentNode.innerHTML='${fallbackChar}'">`
                : fallbackChar
            }
                </div>
                <div class="card-content">
                    <div class="card-title">${item.title}</div>
                    <div class="card-desc">${item.desc}</div>
                </div>
            </a>
        `;
    }

    function getLogoSrc(item) {
        if (item.logo) return item.logo;
        try {
            const domain = new URL(item.url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch {
            return null;
        }
    }

    function attachMainClickListeners() {
        // We used inline onclick for Add Sub, let's catch the custom event
        document.removeEventListener('addSub', handleAddSubEvent); // prevent duplicate
        document.addEventListener('addSub', handleAddSubEvent);

        // Edit/Delete Subcategory
        document.querySelectorAll('.btn-sub-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const isEdit = btn.classList.contains('edit');
                const catId = btn.dataset.catId;
                const subId = btn.dataset.subId;
                if (isEdit) openCategoryModal(2, subId, catId);
                else deleteSubCategory(catId, subId);
            });
        });

        // Edit/Delete Item
        document.querySelectorAll('.btn-card-action.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                openEditItemModal(btn.dataset.id);
            });
        });
        document.querySelectorAll('.btn-card-action.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (confirm('确定要删除这个书签吗？')) deleteItem(btn.dataset.id);
            });
        });
    }

    const handleAddSubEvent = (e) => {
        openCategoryModal(2, null, e.detail);
    };

    /* === Logic: Data Ops === */

    // --- Category Ops ---
    function saveCategory(formData) {
        const { id, name, icon, level, parentId } = formData;

        if (level == 1) {
            if (id) {
                // Update
                const cat = appData.find(c => c.id === id);
                if (cat) { cat.category = name; cat.icon = icon; }
            } else {
                // Add
                appData.push({ id: generateId(), category: name, icon: icon, items: [] });
            }
        } else {
            // Level 2
            const parent = appData.find(c => c.id === parentId);
            if (!parent) return;

            if (id) {
                // Update
                const sub = parent.items.find(s => s.id === id);
                if (sub) sub.name = name;
            } else {
                // Add
                parent.items.push({ id: generateId(), name: name, items: [] });
            }
        }
        saveData();
        closeCategoryModal();
    }

    function deleteCategory(id) {
        const cat = appData.find(c => c.id === id);
        // check items
        let count = 0;
        cat.items.forEach(s => count += s.items.length);
        if (count > 0) {
            if (!confirm(`该分类下有 ${count} 个书签，确定要删除吗？`)) return;
        } else {
            if (!confirm(`确定要删除分类 "${cat.category}" 吗？`)) return;
        }

        appData = appData.filter(c => c.id !== id);
        // Reset current if deleted
        if (currentCategory && currentCategory.id === id) currentCategory = appData[0] || null;
        saveData();
    }

    function deleteSubCategory(parentId, subId) {
        const parent = appData.find(c => c.id === parentId);
        if (!parent) return;

        const sub = parent.items.find(s => s.id === subId);
        if (sub.items.length > 0) {
            if (!confirm(`该二级分类下有 ${sub.items.length} 个书签，确定要删除吗？`)) return;
        } else {
            if (!confirm(`确定要删除二级分类 "${sub.name}" 吗？`)) return;
        }

        parent.items = parent.items.filter(s => s.id !== subId);
        saveData();
    }

    // --- Item Ops ---
    function findItem(id) {
        for (let cat of appData) {
            for (let sub of cat.items) {
                for (let item of sub.items) {
                    if (item._id === id) return { item, cat, sub };
                }
            }
        }
        return null;
    }

    function deleteItem(id) {
        let found = false;
        appData.forEach(cat => {
            cat.items.forEach(sub => {
                const idx = sub.items.findIndex(i => i._id === id);
                if (idx !== -1) {
                    sub.items.splice(idx, 1);
                    found = true;
                }
            });
        });
        if (found) saveData();
    }

    function saveItem(formData) {
        const { id, title, url, desc, logo, categoryId, subCategoryName } = formData;

        if (id) {
            deleteItem(id);
            addItemToData({ _id: id, title, url, desc, logo }, categoryId, subCategoryName);
        } else {
            addItemToData({ _id: generateId(), title, url, desc, logo }, categoryId, subCategoryName);
        }

        saveData();
        closeItemModal();
    }

    function addItemToData(itemObj, catId, subName) {
        const category = appData.find(c => c.id === catId);
        if (!category) return;

        let sub = category.items.find(s => s.name === subName);
        if (!sub) {
            sub = { id: generateId(), name: subName, items: [] };
            category.items.push(sub);
        }
        sub.items.push(itemObj);
    }

    /* === UI Interactions & Modals === */

    // Admin Toggle
    btnToggleAdmin.addEventListener('click', () => {
        if (!currentUser) {
            // Open Login Modal
            loginModal.classList.remove('hidden');
        } else {
            // Toggle Admin Mode
            adminMode = !adminMode;
            toggleAdminModeUI();
        }
    });

    // Login Modal Listeners
    if (loginClose) loginClose.onclick = () => loginModal.classList.add('hidden');
    if (loginBtn) loginBtn.onclick = handleLogin;
    
    function toggleAdminModeUI() {
         if (adminMode) {
            btnToggleAdmin.classList.add('active');
            adminActions.classList.remove('hidden');
            document.body.classList.add('admin-mode');
        } else {
            btnToggleAdmin.classList.remove('active');
            adminActions.classList.add('hidden');
            document.body.classList.remove('admin-mode');
        }
        renderSidebar();
        renderMain();
    }

    // Export Data
    btnExport.addEventListener('click', () => {
        const cleanData = JSON.parse(JSON.stringify(appData));
        cleanData.forEach(c => {
            delete c.id;
            c.items.forEach(s => {
                delete s.id;
                s.items.forEach(i => delete i._id);
            });
        });
        const dataStr = `const navData = ${JSON.stringify(cleanData, null, 2)};`;
        navigator.clipboard.writeText(dataStr).then(() => {
            alert('数据已复制到剪贴板！请覆盖 data.js 文件。');
        }).catch(err => alert('复制失败'));
    });

    // Reset Data
    document.getElementById('btn-reset').addEventListener('click', () => {
        // If logged in, provide option to upload default data
        if (currentUser) {
            if (confirm('确定要重置数据吗？\n这将清空浏览器本地缓存，并将云端数据恢复为 data.js 中的初始内容。')) {
                 appData = JSON.parse(JSON.stringify(navData));
                 normalizeData();
                 
                 // Trigger save manually without full reload first to ensure cloud gets updated
                 // Then reload to refresh UI
                 (async () => {
                    await saveData();
                    location.reload();
                 })();
            }
        } else {
             if (confirm('确定要重置数据吗？\n这将清空浏览器本地缓存，并重新加载 data.js 中的默认数据。\n未导出的修改将丢失！')) {
                localStorage.removeItem('myNavData');
                location.reload();
            }
        }
    });

    // --- Item Modal ---
    function openItemModal() {
        populateCategorySelect();
        itemModal.classList.remove('hidden');
        itemModal.classList.add('flex');
    }

    function closeItemModal() {
        itemModal.classList.add('hidden');
        itemModal.classList.remove('flex');
        itemForm.reset();
        editingItemId = null;
    }

    function populateCategorySelect() {
        inputCategory.innerHTML = appData.map(c => `<option value="${c.id}">${c.category}</option>`).join('');
        if (appData.length > 0) populateSubCategoryList(appData[0].id);
        inputCategory.onchange = (e) => {
            populateSubCategoryList(e.target.value);
            inputSubCategory.value = ''; // Clear subcategory input on change
        };
    }

    function populateSubCategoryList(catId) {
        const cat = appData.find(c => c.id === catId);
        subCategoryList.innerHTML = ''; // Clear existing options

        if (cat && cat.items) {
            // console.log(`Populating subcategories for ${cat.category}:`, cat.items.map(s => s.name));
            subCategoryList.innerHTML = cat.items.map(sub => `<option value="${sub.name}"></option>`).join('');
        }
    }

    function openEditItemModal(id) {
        const result = findItem(id);
        if (!result) return;
        const { item, cat, sub } = result;
        editingItemId = id;

        modalTitle.textContent = "编辑书签";
        document.getElementById('item-id').value = id;
        inputTitle.value = item.title;
        inputUrl.value = item.url;
        inputDesc.value = item.desc || '';
        inputLogo.value = item.logo || '';

        populateCategorySelect();
        inputCategory.value = cat.id;
        populateSubCategoryList(cat.id);
        inputSubCategory.value = sub.name;

        openItemModal();
    }

    btnAdd.addEventListener('click', () => {
        editingItemId = null;
        modalTitle.textContent = "添加书签";
        document.getElementById('item-id').value = '';
        if (currentCategory) {
            populateCategorySelect();
            inputCategory.value = currentCategory.id;
            populateSubCategoryList(currentCategory.id);
        } else {
            openItemModal();
        }
        openItemModal();
    });

    itemModalClose.addEventListener('click', closeItemModal);
    itemModalCancel.addEventListener('click', closeItemModal);

    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveItem({
            id: editingItemId,
            title: inputTitle.value.trim(),
            url: inputUrl.value.trim(),
            desc: inputDesc.value.trim(),
            logo: inputLogo.value.trim(),
            categoryId: inputCategory.value,
            subCategoryName: inputSubCategory.value.trim()
        });
    });

    // --- Category Modal ---
    function openCategoryModal(level, id = null, parentId = null) {
        catIdField.value = id || '';
        catLevelField.value = level;
        catParentIdField.value = parentId || '';

        if (level === 1) {
            catIconGroup.style.display = 'block';
            catModalTitle.textContent = id ? "编辑一级分类" : "新增一级分类";
            catInputIcon.required = true;
            if (id) {
                const cat = appData.find(c => c.id === id);
                catInputName.value = cat.category;
                catInputIcon.value = cat.icon;
            } else {
                catInputName.value = '';
                catInputIcon.value = 'ti ti-folder';
            }
        } else {
            catIconGroup.style.display = 'none';
            catModalTitle.textContent = id ? "编辑二级分类" : "新增二级分类";
            catInputIcon.required = false;

            if (id) {
                const parent = appData.find(c => c.id === parentId);
                const sub = parent.items.find(s => s.id === id);
                catInputName.value = sub.name;
            } else {
                catInputName.value = '';
            }
        }

        catModal.classList.remove('hidden');
        catModal.classList.add('flex');
    }

    function closeCategoryModal() {
        catModal.classList.add('hidden');
        catModal.classList.remove('flex');
        catForm.reset();
    }

    catModalClose.addEventListener('click', closeCategoryModal);
    catModalCancel.addEventListener('click', closeCategoryModal);

    catForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCategory({
            id: catIdField.value,
            level: catLevelField.value,
            parentId: catParentIdField.value,
            name: catInputName.value.trim(),
            icon: catInputIcon.value.trim()
        });
    });

    /* === Search === */
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        if (!keyword) {
            renderMain();
            return;
        }

        const filtered = appData.map(cat => {
            const subs = cat.items.map(sub => ({
                ...sub,
                items: sub.items.filter(i =>
                    i.title.toLowerCase().includes(keyword) ||
                    (i.desc && i.desc.toLowerCase().includes(keyword)) ||
                    i.url.toLowerCase().includes(keyword)
                )
            })).filter(s => s.items.length > 0);
            return { ...cat, items: subs };
        }).filter(c => c.items.length > 0);

        renderMain(filtered);
    });

    // Start
    init();
});
