// 全局变量
let currentPage = 1;
let itemsPerPage = 50;
let allNotes = {
    normal: [],
    yellow: [],
    black: []
};

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 设置默认选中黄名单
    const filterSelect = document.getElementById('filterSelect');
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

        // 如果数据不存在，初始化空数据
        if (!result['normal_list.json']) {
            result['normal_list.json'] = { users: [] };
        }
        if (!result['yellow_list.json']) {
            result['yellow_list.json'] = { users: [] };
        }
        if (!result['black_list.json']) {
            result['black_list.json'] = { users: [] };
        }

        // 更新全局数据
        allNotes = {
            normal: result['normal_list.json'].users || [],
            yellow: result['yellow_list.json'].users || [],
            black: result['black_list.json'].users || []
        };

        console.log('Loaded data:', allNotes);

        // 更新统计数据
        updateStats();
        // 渲染表格
        renderNotes();
    } catch (error) {
        console.error('加载数据失败:', error);
        // 显示错误信息给用户
        alert('加载数据失败，请刷新页面重试');
    }
}

// 渲染备注列表
function renderNotes() {
    const tbody = document.getElementById('notesList');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    // 获取当前筛选条件
    const filterType = document.getElementById('filterSelect').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    // 根据筛选条件获取数据
    let filteredNotes = [];
    if (filterType === 'all') {
        filteredNotes = [
            ...allNotes.normal.map(note => ({ ...note, type: 'normal' })),
            ...allNotes.yellow.map(note => ({ ...note, type: 'yellow' })),
            ...allNotes.black.map(note => ({ ...note, type: 'black' }))
        ];
    } else {
        filteredNotes = allNotes[filterType].map(note => ({ ...note, type: filterType }));
    }

    // 搜索过滤
    if (searchTerm) {
        filteredNotes = filteredNotes.filter(note => 
            note.user_id.toLowerCase().includes(searchTerm) || 
            note.tag.toLowerCase().includes(searchTerm)
        );
    }

    // 分页处理
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageNotes = filteredNotes.slice(startIndex, endIndex);

    // 渲染数据
    pageNotes.forEach(note => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <a href="https://x.com/${note.user_id}" 
                   target="_blank" 
                   class="user-link">
                    @${note.user_id}
                </a>
            </td>
            <td>${note.tag}</td>
            <td>
                <span class="note-type ${note.type}">
                    ${note.type === 'normal' ? '普通名单' : 
                      note.type === 'yellow' ? '黄名单' : '黑名单'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" data-userid="${note.user_id}" data-type="${note.type}">编辑</button>
                    <button class="delete-btn" data-userid="${note.user_id}" data-type="${note.type}">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // 更新分页信息
    updatePagination(filteredNotes.length);
}

// 更新统计数据
function updateStats() {
    document.getElementById('normalCount').textContent = allNotes.normal.length;
    document.getElementById('yellowCount').textContent = allNotes.yellow.length;
    document.getElementById('blackCount').textContent = allNotes.black.length;
}

// 获取类型标签
function getTypeLabel(type) {
    switch (type) {
        case 'normal': return '普通名单';
        case 'yellow': return '黄名单';
        case 'black': return '黑名单';
        default: return '';
    }
}

// 格式化日期函数
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

// 导出数据函数
function exportData() {
    try {
        // 获取当前筛选条件
        const filterType = document.getElementById('filterSelect').value;
        const timestamp = formatDate(Date.now());
        let exportData = {};
        let filename = '';

        // 根据筛选类型准备数据
        switch (filterType) {
            case 'normal':
                exportData = {
                    users: allNotes.normal
                };
                filename = `xtager_normal_list_${timestamp}.json`;
                break;
            case 'yellow':
                exportData = {
                    users: allNotes.yellow
                };
                filename = `xtager_yellow_list_${timestamp}.json`;
                break;
            case 'black':
                exportData = {
                    users: allNotes.black
                };
                filename = `xtager_black_list_${timestamp}.json`;
                break;
            default:
                // 导出所有数据
                exportData = {
                    normal_list: { users: allNotes.normal },
                    yellow_list: { users: allNotes.yellow },
                    black_list: { users: allNotes.black }
                };
                filename = `xtager_all_lists_${timestamp}.json`;
        }

        // 创建 Blob 对象
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
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
        showNotification('导出成功', 'success');
    } catch (error) {
        console.error('导出失败:', error);
        showNotification('导出失败，请重试', 'error');
    }
}

// 添加通知函数
function showNotification(message, type = 'info') {
    // 移除现有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 创建新通知
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .notification.success {
            background: var(--success-color);
        }

        .notification.error {
            background: var(--danger-color);
        }

        @keyframes slideIn {
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(notification);

    // 3秒后移除通知
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

// 设置事件监听
function setupEventListeners() {
    // 搜索和筛选
    document.getElementById('searchInput').addEventListener('input', renderNotes);
    document.getElementById('filterSelect').addEventListener('change', renderNotes);
    
    // 分页控制
    document.getElementById('itemsPerPage').addEventListener('change', function(e) {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderNotes();
    });

    document.getElementById('prevPage').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderNotes();
        }
    });

    document.getElementById('nextPage').addEventListener('click', function() {
        const totalPages = Math.ceil(getTotalItems() / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
        renderNotes();
        }
    });

    // 导出按钮
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    // 页码跳转
    const jumpButton = document.getElementById('jumpButton');
    const pageJumpInput = document.getElementById('pageJump');

    jumpButton.addEventListener('click', () => {
        const pageNum = parseInt(pageJumpInput.value);
        if (pageNum && pageNum > 0) {
            const totalPages = Math.ceil(getTotalItems() / itemsPerPage);
            if (pageNum <= totalPages) {
                currentPage = pageNum;
                renderNotes();
                pageJumpInput.value = '';
            }
        }
    });

    pageJumpInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            jumpButton.click();
        }
    });

    // 添加编辑和删除按钮的事件委托
    document.getElementById('notesList').addEventListener('click', async function(e) {
        if (e.target.classList.contains('edit-btn')) {
            const userId = e.target.dataset.userid;
            const type = e.target.dataset.type;
            openEditModal(userId, type);
        } else if (e.target.classList.contains('delete-btn')) {
            const userId = e.target.dataset.userid;
            const type = e.target.dataset.type;
            await deleteNote(userId, type);
        }
    });
}

// 获取总条数
function getTotalItems() {
    const filterType = document.getElementById('filterSelect').value;
    if (filterType === 'all') {
        return allNotes.normal.length + allNotes.yellow.length + allNotes.black.length;
    }
    return allNotes[filterType].length;
}

// 更新分页信息
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('totalItems').textContent = totalItems;
    
    // 更新按钮状态
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// 添加编辑模态框的函数
async function openEditModal(userId, type) {
    // 查找用户数据
    const user = allNotes[type].find(note => note.user_id === userId);
    if (!user) return;

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>编辑备注</h2>
                <button class="close-btn" id="cancelEdit">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>用户ID:</label>
                    <div class="user-id">@${userId}</div>
                </div>
                <div class="form-group">
                    <label>备注:</label>
                    <input type="text" id="editTag" value="${user.tag}" placeholder="请输入备注内容">
                </div>
                <div class="form-group">
                    <label>类型:</label>
                    <select id="editType">
                        <option value="normal" ${type === 'normal' ? 'selected' : ''}>普通名单</option>
                        <option value="yellow" ${type === 'yellow' ? 'selected' : ''}>黄名单</option>
                        <option value="black" ${type === 'black' ? 'selected' : ''}>黑名单</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelEdit">取消</button>
                <button class="btn btn-primary" id="saveEdit">保存</button>
            </div>
        </div>
    `;

    // 更新样式
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            border-radius: 12px;
            min-width: 400px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            animation: modalFadeIn 0.3s ease-out;
        }
        .modal-header {
            padding: 16px 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-header h2 {
            margin: 0;
            font-size: 18px;
            color: #333;
        }
        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
        }
        .close-btn:hover {
            color: #333;
        }
        .modal-body {
            padding: 20px;
        }
        .modal-footer {
            padding: 16px 20px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group select:focus {
            border-color: #4a90e2;
            outline: none;
        }
        .user-id {
            padding: 10px 12px;
            background: #f5f5f5;
            border-radius: 6px;
            color: #666;
            font-family: monospace;
        }
        .btn {
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-primary {
            background: #4a90e2;
            color: white;
        }
        .btn-primary:hover {
            background: #357abd;
        }
        .btn-secondary {
            background: #f5f5f5;
            color: #333;
        }
        .btn-secondary:hover {
            background: #e5e5e5;
        }
        @keyframes modalFadeIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // 保存按钮事件
    document.getElementById('saveEdit').addEventListener('click', async () => {
        const newTag = document.getElementById('editTag').value;
        const newType = document.getElementById('editType').value;
        await updateNote(userId, type, newTag, newType);
        modal.remove();
        style.remove();
    });

    // 取消按钮事件（包括关闭按钮）
    modal.querySelectorAll('#cancelEdit').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.remove();
            style.remove();
        });
    });

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            style.remove();
        }
    });

    // 自动聚焦到输入框
    document.getElementById('editTag').focus();
}

// 更新备注的函数
async function updateNote(userId, oldType, newTag, newType) {
    try {
        // 如果类型没变，只更新标签
        if (oldType === newType) {
            const index = allNotes[oldType].findIndex(note => note.user_id === userId);
            if (index !== -1) {
                allNotes[oldType][index].tag = newTag;
            }
        } else {
            // 如果类型改变，需要移动到新类型
            const userNote = allNotes[oldType].find(note => note.user_id === userId);
            if (userNote) {
                // 从旧类型中删除
                allNotes[oldType] = allNotes[oldType].filter(note => note.user_id !== userId);
                // 添加到新类型中
                userNote.tag = newTag;
                allNotes[newType].push(userNote);
            }
        }

        // 保存到 storage
        await chrome.storage.local.set({
            'normal_list.json': { users: allNotes.normal },
            'yellow_list.json': { users: allNotes.yellow },
            'black_list.json': { users: allNotes.black }
        });

        // 更新显示
        updateStats();
        renderNotes();
        showNotification('更新成功', 'success');
    } catch (error) {
        console.error('更新失败:', error);
        showNotification('更新失败，请重试', 'error');
    }
} 