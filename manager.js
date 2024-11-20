// 全局变量
let currentPage = 1;
let itemsPerPage = 50; // 默认每页50条
const maxItemsPerPage = 1000; // 最大每页1000条
let allNotes = {
    normal: [],
    yellow: [],
    black: []
};

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 设置默认选中黄名单
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) {
        filterSelect.value = 'yellow';
    }
    
    loadAllLists();
    setupEventListeners();
});

// 加载所有名单数据
async function loadAllLists() {
    try {
        // 从 chrome.storage.local 获取数据
        const result = await chrome.storage.local.get([
            'normal_list.json',
            'yellow_list.json',
            'black_list.json'
        ]);

        // 确保数据存在且格式正确
        allNotes = {
            normal: (result['normal_list.json']?.users || []),
            yellow: (result['yellow_list.json']?.users || []),
            black: (result['black_list.json']?.users || [])
        };

        console.log('加载的数据:', allNotes);
        
        // 更新统计和显示
        updateStats();
        renderNotes();
    } catch (error) {
        console.error('加载数据失败:', error);
        // 确保即使加载失败也初始化为空数组
        allNotes = {
            normal: [],
            yellow: [],
            black: []
        };
        alert('加载数据失败，请刷新页面重试');
    }
}

// 更新统计数据
function updateStats() {
    const normalCount = document.getElementById('normalCount');
    const yellowCount = document.getElementById('yellowCount');
    const blackCount = document.getElementById('blackCount');

    if (normalCount) normalCount.textContent = allNotes.normal?.length || 0;
    if (yellowCount) yellowCount.textContent = allNotes.yellow?.length || 0;
    if (blackCount) blackCount.textContent = allNotes.black?.length || 0;
}

// 渲染备注列表
function renderNotes() {
    const tbody = document.getElementById('notesTableBody');
    if (!tbody) return; // 确保元素存在

    tbody.innerHTML = '';
    
    // 确保所有数组都存在
    const allUsers = [
        ...(allNotes.normal || []).map(user => ({...user, type: 'normal'})),
        ...(allNotes.yellow || []).map(user => ({...user, type: 'yellow'})),
        ...(allNotes.black || []).map(user => ({...user, type: 'black'}))
    ];

    // 根据当前筛选条件过滤
    const filterSelect = document.querySelector('.filter-select');
    const searchInput = document.querySelector('.search-input');
    
    if (!filterSelect || !searchInput) return; // 确保元素存在

    const filterType = filterSelect.value;
    const searchTerm = searchInput.value.toLowerCase();

    const filteredUsers = allUsers.filter(user => {
        const matchesFilter = filterType === 'all' || user.type === filterType;
        const matchesSearch = user.user_id.toLowerCase().includes(searchTerm) || 
                            user.tag.toLowerCase().includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    // 分页处理
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    // 渲染表格
    pageUsers.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <a href="https://x.com/${user.user_id}" 
                   target="_blank" 
                   class="user-link">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    @${user.user_id}
                </a>
            </td>
            <td>${user.tag}</td>
            <td>
                <span class="note-type ${user.type}">
                    ${getTypeLabel(user.type)}
                </span>
            </td>
            <td>
                <button onclick="editNote('${user.user_id}', '${user.type}')" class="table-action-button edit">编辑</button>
                <button onclick="deleteNote('${user.user_id}', '${user.type}')" class="table-action-button delete">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    updatePagination(filteredUsers.length);
}

// 处理搜索
function handleSearch(e) {
    currentPage = 1;
    renderNotes();
}

// 处理筛选
function handleFilter(e) {
    currentPage = 1;
    renderNotes();
}

// 添加格式化日期的函数
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hour}${minute}${second}`;
}

// 修改导出数据的函数
function exportData(type = 'all') {
    try {
        let exportData = {};
        const timestamp = formatDate(Date.now());
        let filename = '';

        switch (type) {
            case 'normal':
                exportData = { normal_list: { users: allNotes.normal } };
                filename = `xtager_normal_list_${timestamp}.json`;
                break;
            case 'yellow':
                exportData = { yellow_list: { users: allNotes.yellow } };
                filename = `xtager_yellow_list_${timestamp}.json`;
                break;
            case 'black':
                exportData = { black_list: { users: allNotes.black } };
                filename = `xtager_black_list_${timestamp}.json`;
                break;
            default:
                exportData = {
                    normal_list: { users: allNotes.normal },
                    yellow_list: { users: allNotes.yellow },
                    black_list: { users: allNotes.black }
                };
                filename = `xtager_all_lists_${timestamp}.json`;
        }
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        // 触发下载
        document.body.appendChild(a);
        a.click();
        
        // 清理
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 显示成功提示
        showNotification(`${getExportTypeName(type)}导出成功`, 'success');
    } catch (error) {
        console.error('导出失败:', error);
        showNotification('导出失败，请重试', 'error');
    }
}

// 获取导出类型的中文名称
function getExportTypeName(type) {
    switch (type) {
        case 'normal': return '普通名单';
        case 'yellow': return '黄名单';
        case 'black': return '黑名单';
        default: return '全部名单';
    }
}

// 添加通知函数
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `xtager-notification ${type}`;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        .xtager-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            animation: notificationSlide 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .xtager-notification.success {
            background: #28a745;
        }

        .xtager-notification.error {
            background: #dc3545;
        }

        @keyframes notificationSlide {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // 3秒后自动移除通知
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(100px)';
        notification.style.transition = 'all 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}

// 工具函数：获取类型标签
function getTypeLabel(type) {
    switch(type) {
        case 'yellow': return '⚠️ 黄名单';
        case 'black': return '🚫 黑名单';
        default: return '普通名单';
    }
}

// 更新分页
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationCenter = document.querySelector('.pagination-center');
    if (!paginationCenter) return;

    // 更新页码信息
    const pageInfo = document.querySelector('.page-info');
    if (pageInfo) {
        pageInfo.textContent = `第 ${currentPage}/${totalPages} 页，共 ${totalItems} 条`;
    }

    // 如果总页数小于等于1，隐藏分页控件
    if (totalPages <= 1) {
        paginationCenter.style.display = 'none';
        return;
    }

    paginationCenter.style.display = 'flex';

    // 清空现有的页码按钮
    const pageNumbers = paginationCenter.querySelector('.page-numbers');
    if (pageNumbers) {
        pageNumbers.innerHTML = '';
    }

    // 添加页码按钮
    const addPageButton = (text, page, isActive = false) => {
        const button = document.createElement('button');
        button.className = `page-button${isActive ? ' active' : ''}`;
        button.textContent = text;
        if (page) {
            button.onclick = () => {
                currentPage = page;
                renderNotes();
            };
        }
        return button;
    };

    // 上一页按钮
    const prevButton = paginationCenter.querySelector('#prevPage');
    if (prevButton) {
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderNotes();
            }
        };
    }

    // 添加页码按钮
    if (pageNumbers) {
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (startPage > 1) {
            pageNumbers.appendChild(addPageButton('1', 1));
            if (startPage > 2) {
                pageNumbers.appendChild(addPageButton('...', null));
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.appendChild(addPageButton(i.toString(), i, i === currentPage));
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.appendChild(addPageButton('...', null));
            }
            pageNumbers.appendChild(addPageButton(totalPages.toString(), totalPages));
        }
    }

    // 下一页按钮
    const nextButton = paginationCenter.querySelector('#nextPage');
    if (nextButton) {
        nextButton.disabled = currentPage === totalPages;
        nextButton.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderNotes();
            }
        };
    }

    // 设置页码输入框的最大值
    const pageJump = document.getElementById('pageJump');
    if (pageJump) {
        pageJump.max = totalPages;
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 搜索和筛选
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', handleFilter);
    }

    // 导出按钮和选项
    const exportOptions = document.querySelectorAll('.export-option');
    exportOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const type = this.dataset.type;
            exportData(type);
        });
    });

    // 每页显示数量
    const pageSizeSelect = document.getElementById('pageSize');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1;
            renderNotes();
        });
    }

    // 页码跳转
    const pageJump = document.getElementById('pageJump');
    const jumpButton = document.querySelector('.page-jump-button');
    
    if (pageJump && jumpButton) {
        jumpButton.addEventListener('click', () => {
            const page = parseInt(pageJump.value);
            if (page && page > 0) {
                jumpToPage(page);
            }
        });

        pageJump.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const page = parseInt(this.value);
                if (page && page > 0) {
                    jumpToPage(page);
                }
            }
        });
    }

    // 监听来自 content script 的更新消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'updateNotes') {
            console.log('收到更新通知:', message.data);
            loadAllLists(); // 重新加载数据
        }
    });
}

// 添加跳页功能
function jumpToPage(page) {
    const totalPages = Math.ceil(getTotalFilteredItems() / itemsPerPage);
    if (page > 0 && page <= totalPages) {
        currentPage = page;
        renderNotes();
    } else {
        alert(`请输入1-${totalPages}之间的页码`);
    }
}

// 获取筛选后的总条目数
function getTotalFilteredItems() {
    const filterType = document.querySelector('.filter-select').value;
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();

    let allUsers = [
        ...allNotes.normal.map(user => ({...user, type: 'normal'})),
        ...allNotes.yellow.map(user => ({...user, type: 'yellow'})),
        ...allNotes.black.map(user => ({...user, type: 'black'}))
    ];

    return allUsers.filter(user => {
        const matchesFilter = filterType === 'all' || user.type === filterType;
        const matchesSearch = user.user_id.toLowerCase().includes(searchTerm) || 
                            user.tag.toLowerCase().includes(searchTerm);
        return matchesFilter && matchesSearch;
    }).length;
}

// 编辑备注
async function editNote(username, type) {
    try {
        // 找到用户当前的备注信息
        let userNote;
        switch (type) {
            case 'yellow':
                userNote = allNotes.yellow.find(u => u.user_id === username);
                break;
            case 'black':
                userNote = allNotes.black.find(u => u.user_id === username);
                break;
            default:
                userNote = allNotes.normal.find(u => u.user_id === username);
        }

        if (!userNote) return;

        // 创建并显示美化的编辑对话框
        const dialog = document.createElement('div');
        dialog.className = 'xtager-dialog';
        dialog.innerHTML = `
            <div class="xtager-dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">
                        <span class="dialog-icon">✏️</span>
                        <span class="dialog-text">
                            <h3>编辑备注</h3>
                            <p>@${username}</p>
                        </span>
                    </div>
                </div>
                <div class="dialog-body">
                    <div class="input-group">
                        <input type="text" id="noteText" placeholder="输入备注内容" maxlength="50" 
                               value="${userNote.tag}">
                    </div>
                    <div class="list-selector">
                        <div class="list-option normal ${type === 'normal' ? 'active' : ''}" data-type="normal">
                            <div class="option-content">
                                <span class="option-icon">📝</span>
                                <span class="option-text">普通名单</span>
                            </div>
                            <div class="option-check">✓</div>
                        </div>
                        <div class="list-option yellow ${type === 'yellow' ? 'active' : ''}" data-type="yellow">
                            <div class="option-content">
                                <span class="option-icon">⚠️</span>
                                <span class="option-text">黄名单</span>
                            </div>
                            <div class="option-check">✓</div>
                        </div>
                        <div class="list-option black ${type === 'black' ? 'active' : ''}" data-type="black">
                            <div class="option-content">
                                <span class="option-icon">🚫</span>
                                <span class="option-text">黑名单</span>
                            </div>
                            <div class="option-check">✓</div>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button id="cancelNote" class="dialog-button cancel">取消</button>
                    <button id="saveNote" class="dialog-button save">保存</button>
                </div>
            </div>
        `;

        // 添加样式
        const dialogStyle = document.createElement('style');
        dialogStyle.textContent = `
            .xtager-dialog {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(4px);
            }

            .xtager-dialog-content {
                background: white;
                width: 360px;
                border-radius: 20px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                overflow: hidden;
                animation: dialogShow 0.2s ease-out;
            }

            @keyframes dialogShow {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }

            .dialog-header {
                padding: 20px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            }

            .dialog-title {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .dialog-icon {
                font-size: 24px;
                width: 40px;
                height: 40px;
                background: #f7f9fa;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dialog-text h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #0f1419;
            }

            .dialog-text p {
                margin: 4px 0 0 0;
                font-size: 14px;
                color: #536471;
            }

            .dialog-body {
                padding: 20px;
            }

            .input-group {
                margin-bottom: 16px;
            }

            .input-group input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #eee;
                border-radius: 12px;
                font-size: 14px;
                transition: all 0.2s;
            }

            .input-group input:focus {
                border-color: #1da1f2;
                outline: none;
                box-shadow: 0 0 0 3px rgba(29, 161, 242, 0.1);
            }

            .list-selector {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .list-option {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                border: 2px solid #eee;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s;
                user-select: none;
            }

            .list-option:hover {
                background: #f7f9fa;
            }

            .option-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .option-icon {
                font-size: 16px;
            }

            .option-text {
                font-size: 14px;
                font-weight: 500;
                color: #0f1419;
            }

            .option-check {
                color: #1da1f2;
                font-weight: bold;
                opacity: 0;
                transition: all 0.2s;
            }

            .list-option.active {
                border-color: #1da1f2;
                background: #f8faff;
            }

            .list-option.active .option-check {
                opacity: 1;
            }

            .list-option.yellow.active {
                border-color: #ffa000;
                background: #fff8e1;
            }

            .list-option.yellow.active .option-check {
                color: #ffa000;
            }

            .list-option.black.active {
                border-color: #dc3545;
                background: #fff5f5;
            }

            .list-option.black.active .option-check {
                color: #dc3545;
            }

            .dialog-footer {
                padding: 16px 20px;
                border-top: 1px solid rgba(0, 0, 0, 0.06);
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }

            .dialog-button {
                padding: 10px 20px;
                border: none;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .dialog-button.cancel {
                background: #f7f9fa;
                color: #0f1419;
            }

            .dialog-button.cancel:hover {
                background: #e1e8ed;
            }

            .dialog-button.save {
                background: #1da1f2;
                color: white;
            }

            .dialog-button.save:hover {
                background: #1a91da;
                transform: translateY(-1px);
            }
        `;

        document.head.appendChild(dialogStyle);
        document.body.appendChild(dialog);

        // 绑定事件
        let selectedType = type;

        // 类型选择点击事件
        const listOptions = dialog.querySelectorAll('.list-option');
        listOptions.forEach(option => {
            option.addEventListener('click', () => {
                listOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                selectedType = option.dataset.type;
            });
        });

        // 取消按钮
        dialog.querySelector('#cancelNote').onclick = () => {
            dialog.style.opacity = '0';
            setTimeout(() => dialog.remove(), 200);
        };

        // 保存按钮
        dialog.querySelector('#saveNote').onclick = async () => {
            const text = dialog.querySelector('#noteText').value.trim();
            if (text) {
        // 更新备注
                const targetFile = selectedType === 'yellow' ? 'yellow_list.json' : 
                                selectedType === 'black' ? 'black_list.json' : 
                         'normal_list.json';

        const result = await chrome.storage.local.get([targetFile]);
        let data = result[targetFile] || { users: [] };

                // 从所有列表中移除该用户
                const allFiles = ['normal_list.json', 'yellow_list.json', 'black_list.json'];
                for (const file of allFiles) {
                    const fileData = (await chrome.storage.local.get([file]))[file] || { users: [] };
                    fileData.users = fileData.users.filter(u => u.user_id !== username);
                    await chrome.storage.local.set({ [file]: fileData });
                }

                // 添加到新的列表
        data.users.push({
            user_id: username,
                    tag: text
        });

        // 保存更新后的数据
        await chrome.storage.local.set({ [targetFile]: data });

                // 关闭话框
                dialog.style.opacity = '0';
                setTimeout(() => dialog.remove(), 200);

        // 重新加载数据
        await loadAllLists();
            }
        };

        // 自动聚焦输入框
        dialog.querySelector('#noteText').focus();

    } catch (error) {
        console.error('编辑备注失败:', error);
        alert('编辑备注失败，请重试');
    }
}

// 删除备注
async function deleteNote(username, type) {
    try {
        if (!confirm(`确定要删除 @${username} 的备注吗？`)) return;

        // 确定目标文件
        const targetFile = type === 'yellow' ? 'yellow_list.json' : 
                         type === 'black' ? 'black_list.json' : 
                         'normal_list.json';

        // 从存储中获取数据
        const result = await chrome.storage.local.get([targetFile]);
        let data = result[targetFile] || { users: [] };

        // 移除用户
        data.users = data.users.filter(u => u.user_id !== username);

        // 保存更新后的数据
        await chrome.storage.local.set({ [targetFile]: data });

        // 重新加载数据
        await loadAllLists();

        console.log('删除成功:', username);
    } catch (error) {
        console.error('删除备注失败:', error);
        alert('删除备注失败，请重试');
    }
} 