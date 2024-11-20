// 存储用户备注的数据
let userNotes = {
    normal: [],
    yellow: [],
    black: []
};

// 从存储中加载备注数据
async function loadNotes() {
    try {
        // 从存储中获取数据
        const result = await chrome.storage.local.get(['normal_list.json', 'yellow_list.json', 'black_list.json']);
        
        userNotes = {
            normal: (result['normal_list.json'] || {}).users || [],
            yellow: (result['yellow_list.json'] || {}).users || [],
            black: (result['black_list.json'] || {}).users || []
        };

        console.log('加载的数据:', userNotes);
        processPage();
    } catch (error) {
        console.error('加载备注数据失败:', error);
    }
}

// 处理页面上的用户名
function processPage() {
    console.log('开始处理页面');
    const userElements = document.querySelectorAll('div[data-testid="User-Name"], div[data-testid="UserName"]');
    userElements.forEach(element => processElement(element));
}

// 查找用户备注
function findUserNote(username) {
    const normalUser = userNotes.normal.find(u => u.user_id === username);
    if (normalUser) return { ...normalUser, type: 'normal' };
    
    const yellowUser = userNotes.yellow.find(u => u.user_id === username);
    if (yellowUser) return { ...yellowUser, type: 'yellow' };
    
    const blackUser = userNotes.black.find(u => u.user_id === username);
    if (blackUser) return { ...blackUser, type: 'black' };
    
    return null;
}

// 更新样式
const style = document.createElement('style');
style.textContent = `
    .xtager-note-container {
        margin: 0 4px;
        font-size: inherit;
        display: inline-block;
        vertical-align: middle;
        position: relative;
        z-index: 2;
    }

    .xtager-add-button {
        background: none;
        border: none;
        color: #1da1f2;
        cursor: pointer;
        padding: 0 4px;
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        border-radius: 4px;
        opacity: 0.8;
        transition: opacity 0.2s;
        position: relative;
        z-index: 2;
    }

    .xtager-add-button:hover {
        background-color: rgba(29, 161, 242, 0.1);
        opacity: 1;
    }

    .xtager-note {
        display: inline-block;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        padding: 0 4px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        z-index: 2;
    }

    .xtager-note:hover {
        background-color: rgba(29, 161, 242, 0.1);
    }

    .xtager-note .note-text {
        display: inline-block;
        vertical-align: middle;
        position: relative;
        z-index: 2;
    }

    .xtager-note.normal {
        color: #1da1f2;
    }

    .xtager-note.yellow {
        color: #ffa000;
    }

    .xtager-note.black {
        color: #d32f2f;
    }

    /* 防止点击穿透 */
    .xtager-note-container * {
        pointer-events: auto;
    }
`;

document.head.appendChild(style);

// 监听页面变化
const observer = new MutationObserver((mutations) => {
    const hasRelevantChanges = mutations.some(mutation => {
        return mutation.addedNodes.length > 0 || 
               mutation.type === 'attributes' && mutation.attributeName === 'data-testid';
    });
    
    if (hasRelevantChanges) {
        processPage();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-testid']
});

// 初始加载
console.log('content.js 开始执行'); // 调试日志
loadNotes();

// 定期检查新的用户名素
setInterval(processPage, 2000); 

// 显示添加/编辑备注的对话框
function showNoteDialog(username) {
    const userNote = findUserNote(username);
    
    const dialog = document.createElement('div');
    dialog.className = 'xtager-dialog';
    dialog.innerHTML = `
        <div class="xtager-dialog-content">
            <div class="dialog-header">
                <h3>${userNote ? '编辑' : '添加'}备注</h3>
                <p>@${username}</p>
            </div>
            <div class="dialog-body">
                <div class="input-group">
                    <textarea id="noteText" 
                            placeholder="输入备注内容" 
                            maxlength="200" 
                            rows="3">${userNote ? userNote.tag : ''}</textarea>
                    <div class="input-counter">
                        <span id="charCount">0</span>/200
                    </div>
                </div>
                <div class="list-selector">
                    <div class="list-option normal ${userNote?.type === 'normal' ? 'active' : ''}" data-type="normal">
                        <div class="option-icon">📝</div>
                        <div class="option-text">普通名单</div>
                    </div>
                    <div class="list-option yellow ${userNote?.type === 'yellow' ? 'active' : ''}" data-type="yellow">
                        <div class="option-icon">⚠️</div>
                        <div class="option-text">黄名单</div>
                    </div>
                    <div class="list-option black ${userNote?.type === 'black' ? 'active' : ''}" data-type="black">
                        <div class="option-icon">🚫</div>
                        <div class="option-text">黑名单</div>
                    </div>
                </div>
            </div>
            <div class="dialog-footer">
                <button id="cancelNote" class="dialog-button cancel">取消</button>
                <button id="saveNote" class="dialog-button save">保存</button>
            </div>
        </div>
    `;

    // 更新样式
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
            width: 400px;
            border-radius: 16px;
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
            text-align: center;
        }

        .dialog-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #0f1419;
        }

        .dialog-header p {
            margin: 4px 0 0 0;
            font-size: 14px;
            color: #536471;
        }

        .dialog-body {
            padding: 20px;
        }

        .input-group {
            margin-bottom: 20px;
            position: relative;
        }

        .input-group textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #eee;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.5;
            resize: none;
            transition: all 0.2s;
            font-family: inherit;
            min-height: 80px;
        }

        .input-group textarea:focus {
            border-color: #1da1f2;
            outline: none;
            box-shadow: 0 0 0 3px rgba(29, 161, 242, 0.1);
        }

        .input-counter {
            position: absolute;
            bottom: -20px;
            right: 4px;
            font-size: 12px;
            color: #536471;
        }

        .input-counter.limit {
            color: #dc3545;
        }

        .list-selector {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }

        .list-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 12px;
            border: 2px solid #eee;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
        }

        .list-option:hover {
            background: #f7f9fa;
        }

        .option-icon {
            font-size: 20px;
            width: 40px;
            height: 40px;
            background: #f7f9fa;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .option-text {
            font-size: 13px;
            font-weight: 500;
            color: #0f1419;
        }

        .list-option.active {
            border-color: #1da1f2;
            background: #f8faff;
        }

        .list-option.active .option-icon {
            background: #e8f5fd;
        }

        .list-option.yellow.active {
            border-color: #ffa000;
            background: #fff8e1;
        }

        .list-option.yellow.active .option-icon {
            background: #fff3e0;
        }

        .list-option.black.active {
            border-color: #dc3545;
            background: #fff5f5;
        }

        .list-option.black.active .option-icon {
            background: #ffebee;
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

    // 添加字数统计功能
    const textarea = dialog.querySelector('#noteText');
    const charCount = dialog.querySelector('#charCount');
    const updateCharCount = () => {
        const count = textarea.value.length;
        charCount.textContent = count;
        charCount.parentElement.classList.toggle('limit', count >= 190);
    };
    textarea.addEventListener('input', updateCharCount);
    updateCharCount(); // 初始化计数

    // 绑定事件
    let selectedType = userNote ? userNote.type : 'normal';

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
            await saveNote(username, text, selectedType);
            dialog.style.opacity = '0';
            setTimeout(() => dialog.remove(), 200);
        }
    };

    // 自动聚焦输入框
    dialog.querySelector('#noteText').focus();

    // 自动调整文本框高度
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

// 修改保存备注的函数
async function saveNote(username, text, type) {
    try {
        // 检查扩展上下文
        if (!chrome?.runtime?.id) {
            // 如果扩展上下文无效，尝试重新加载页面
            location.reload();
            return;
        }

        // 根据类型选择正确的文件
        let targetFile;
        switch (type) {
            case 'yellow':
                targetFile = 'yellow_list.json';
                break;
            case 'black':
                targetFile = 'black_list.json';
                break;
            default:
                targetFile = 'normal_list.json';
        }

        // 使用 Promise 包装存储操作
        const saveToStorage = () => new Promise((resolve, reject) => {
            chrome.storage.local.get([targetFile], function(result) {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                let data = result[targetFile] || { users: [] };
                
                // 更新数据
                data.users = data.users.filter(u => u.user_id !== username);
                data.users.push({
                    user_id: username,
                    tag: text
                });

                chrome.storage.local.set({ [targetFile]: data }, function() {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    resolve(data);
                });
            });
        });

        // 执行保存操作
        await saveToStorage();

        // 从其他列表中移除该用户
        const removeFromOtherLists = async () => {
            const otherFiles = ['normal_list.json', 'yellow_list.json', 'black_list.json']
                .filter(f => f !== targetFile);

            for (const file of otherFiles) {
                await new Promise((resolve, reject) => {
                    chrome.storage.local.get([file], function(result) {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                            return;
                        }

                        let fileData = result[file] || { users: [] };
                        fileData.users = fileData.users.filter(u => u.user_id !== username);

                        chrome.storage.local.set({ [file]: fileData }, function() {
                            if (chrome.runtime.lastError) {
                                reject(new Error(chrome.runtime.lastError.message));
                                return;
                            }
                            resolve();
                        });
                    });
                });
            }
        };

        await removeFromOtherLists();

        // 立即更新页面显示
        const userElements = document.querySelectorAll('div[data-testid="User-Name"], div[data-testid="UserName"]');
        userElements.forEach(element => {
            const usernameLink = element.querySelector(`a[href="/${username}"]`);
            if (usernameLink) {
                // 移除旧的备注容器
                const oldNote = element.querySelector('.xtager-note-container');
                if (oldNote) {
                    oldNote.remove();
                }
                // 重新添加备注
                element.dataset.xtagProcessed = false;
                processElement(element);
            }
        });

        // 显示成功提示
        showNotification('保存成功', 'success');

    } catch (error) {
        console.error('保存备注失败:', error);
        
        // 显示错误提示
        showNotification('保存失败，请刷新页面重试', 'error');
        
        // 如果是扩展上下文失效，提示用户刷新页面
        if (!chrome?.runtime?.id) {
            setTimeout(() => {
                if (confirm('扩展需要重新加载，是否刷新页面？')) {
                    location.reload();
                }
            }, 500);
        }
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

// 处理单个元素
function processElement(element) {
    if (element.dataset.xtagProcessed) return;
    
    const usernameLink = element.querySelector('a[href^="/"]');
    if (!usernameLink) return;
    
    const username = usernameLink.getAttribute('href').substring(1).split('/')[0];
    if (!username) return;

    element.dataset.xtagProcessed = 'true';

    // 创建备注容器
    const noteContainer = document.createElement('span');
    noteContainer.className = 'xtager-note-container';
    
    const userNote = findUserNote(username);
    
    if (userNote) {
        // 显示现有备注
        const noteSpan = document.createElement('span');
        noteSpan.className = `xtager-note ${userNote.type}`;
        noteSpan.innerHTML = `
            ${userNote.type === 'yellow' ? '⚠️ ' : userNote.type === 'black' ? '🚫 ' : ''}
            <span class="note-text">${userNote.tag}</span>
        `;
        
        // 添加点击事件
        noteSpan.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showNoteDialog(username);
        });
        
        noteContainer.appendChild(noteSpan);
    } else {
        // 显示添加备注按钮
        const addButton = document.createElement('button');
        addButton.textContent = '添加备注';
        addButton.className = 'xtager-add-button';
        addButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showNoteDialog(username);
        };
        noteContainer.appendChild(addButton);
    }

    // 找到时间元素
    const timeElement = element.querySelector('time');
    if (timeElement) {
        // 将备注插入到用户名和时间之间
        timeElement.parentNode.insertBefore(noteContainer, timeElement);
    } else {
        // 如果找不到时间元素，就直接添加到用户名后面
        element.appendChild(noteContainer);
    }
} 