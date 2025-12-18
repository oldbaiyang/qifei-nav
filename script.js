document.addEventListener('DOMContentLoaded', () => {
    const navMenu = document.getElementById('nav-menu');
    const contentWrapper = document.getElementById('content-wrapper');
    const searchInput = document.getElementById('search-input');

    // 记录当前选中的分类 ID，默认为第一个
    let currentActiveId = navData.length > 0 ? navData[0].id : null;

    // 1. 初始化渲染
    function render() {
        renderSidebar();
        // 默认显示第一个分类
        if (currentActiveId) {
            const initialCategory = navData.find(c => c.id === currentActiveId);
            if (initialCategory) {
                renderContent([initialCategory]);
            }
        }
    }

    // 渲染侧边栏导航
    function renderSidebar() {
        navMenu.innerHTML = navData.map(category => `
            <a href="#${category.id}" class="nav-item ${category.id === currentActiveId ? 'active' : ''}" data-id="${category.id}">
                <i class="${category.icon}"></i>
                <span>${category.category}</span>
            </a>
        `).join('');

        // 点击事件处理
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.dataset.id;

                // 更新状态
                currentActiveId = targetId;

                // 更新 UI Active 状态
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // 渲染选中分类的内容
                const targetCategory = navData.find(c => c.id === targetId);
                if (targetCategory) {
                    renderContent([targetCategory]);
                }

                // 滚回顶部
                window.scrollTo({ top: 0, behavior: 'instant' });
            });
        });
    }

    // 渲染主内容区 (接受一个分类数组作为参数)
    function renderContent(dataToRender) {
        if (!dataToRender || dataToRender.length === 0) {
            contentWrapper.innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding:2rem;">未找到相关内容</div>`;
            return;
        }

        contentWrapper.innerHTML = dataToRender.map(category => `
            <section id="${category.id}" class="category-section">
                <h2 class="category-title">
                    <i class="${category.icon}"></i>
                    ${category.category}
                </h2>
                ${category.items.map(subCategory => `
                    <div class="sub-category">
                        <h3 class="sub-category-title">${subCategory.name}</h3>
                        <div class="card-grid">
                            ${subCategory.items.map(item => createCardHTML(item)).join('')}
                        </div>
                    </div>
                `).join('')}
            </section>
        `).join('');
    }

    // 辅助函数：提取域名
    function getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return '';
        }
    }

    // 生成单个卡片 HTML
    function createCardHTML(item) {
        // 优先使用 data.js 中的 logo，如果没有，则尝试自动获取
        let logoSrc = item.logo;
        if (!logoSrc) {
            const domain = getDomain(item.url);
            if (domain) {
                // Google Favicon 服务
                logoSrc = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            }
        }

        // 图片加载失败时的处理逻辑 (onerror)
        // 注意：Google API 通常会返回一个默认地球图标而不是 404，所以 onerror 可能不会触发。
        // 但对于直接指定的错误图片路径，它依然有效。
        // 这里的逻辑：先显示 logoSrc，如果出错或本来就没有 logoSrc，显示首字母

        const fallbackChar = item.title ? item.title[0] : '#';

        return `
            <a href="${item.url}" target="_blank" class="card">
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

    // 2. 搜索功能
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase().trim();

        // 如果没有关键词，恢复显示当前选中的分类
        if (!keyword) {
            const currentCategory = navData.find(c => c.id === currentActiveId);
            if (currentCategory) {
                renderContent([currentCategory]);
            }
            return;
        }

        // 过滤数据 (全局搜索)
        const filteredData = navData.map(category => {
            // 过滤每个二级分类下的 items
            const filteredSubCategories = category.items.map(subCat => {
                const filteredItems = subCat.items.filter(item =>
                    item.title.toLowerCase().includes(keyword) ||
                    item.desc.toLowerCase().includes(keyword) ||
                    item.url.toLowerCase().includes(keyword)
                );
                return { ...subCat, items: filteredItems };
            }).filter(subCat => subCat.items.length > 0);

            return {
                ...category,
                items: filteredSubCategories
            };
        }).filter(category => category.items.length > 0);

        // 渲染搜索结果
        renderContent(filteredData);
    });

    // 启动
    render();
});
