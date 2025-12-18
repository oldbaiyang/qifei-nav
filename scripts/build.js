const fs = require('fs');
const path = require('path');

// Paths
const rootDir = path.join(__dirname, '..');
const dataPath = path.join(rootDir, 'data.js');
const indexPath = path.join(rootDir, 'index.html');

// 1. Read Data
let navData = [];
try {
    let dataContent = fs.readFileSync(dataPath, 'utf8');
    // Remove 'const' to assign to our let navData
    dataContent = dataContent.replace('const navData', 'navData');
    eval(dataContent);
    if (typeof navData === 'undefined') {
        throw new Error('navData is undefined after eval');
    }
} catch (err) {
    console.error('Error reading data.js:', err);
    process.exit(1);
}

// 2. Helper Functions (Duplicated from script.js roughly)
function getDomain(url) {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return '';
    }
}

function createCardHTML(item) {
    let logoSrc = item.logo;
    if (!logoSrc) {
        const domain = getDomain(item.url);
        if (domain) {
            logoSrc = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        }
    }
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
                    <div class="card-desc">${item.desc || ''}</div>
                </div>
            </a>
    `;
}

// 3. Generate HTML
// A. Sidebar
const sidebarHTML = navData.map((category, index) => `
            <div data-id="${category.id || ''}"> <!-- Static wrapper -->
                <a href="#${category.id || ''}" class="nav-item ${index === 0 ? 'active' : ''}" data-id="${category.id || ''}">
                     <div style="display:flex;align-items:center;gap:0.75rem;flex:1;min-width:0;">
                        <i class="${category.icon}"></i>
                        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${category.category}</span>
                    </div>
                </a>
            </div>
`).join('');

// B. Main Content (Render ALL for SEO)
const contentHTML = navData.map(category => `
        <section class="category-section" id="${category.id || ''}">
            <h2 class="category-title">
                <i class="${category.icon}"></i> ${category.category}
            </h2>
            ${category.items.map(subCategory => `
                <div class="sub-category">
                    <div class="subcategory-header">
                         <h3 class="sub-category-title">${subCategory.name}</h3>
                    </div>
                    <div class="card-grid">
                        ${subCategory.items.map(item => createCardHTML(item)).join('')}
                    </div>
                </div>
            `).join('')}
        </section>
`).join('');


// 4. Inject into index.html
try {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');

    // Replace Sidebar
    htmlContent = htmlContent.replace(
        /(<!-- SIDEBAR_START -->)([\s\S]*?)(<!-- SIDEBAR_END -->)/,
        `$1\n${sidebarHTML}\n$3`
    );

    // Replace Content
    htmlContent = htmlContent.replace(
        /(<!-- CONTENT_START -->)([\s\S]*?)(<!-- CONTENT_END -->)/,
        `$1\n${contentHTML}\n$3`
    );

    fs.writeFileSync(indexPath, htmlContent, 'utf8');
    console.log('Successfully injected static content into index.html');

} catch (err) {
    console.error('Error updating index.html:', err);
    process.exit(1);
}
