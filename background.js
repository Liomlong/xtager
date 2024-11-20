chrome.runtime.onInstalled.addListener(function() {
    // 初始化存储数据
    chrome.storage.local.get(['watchlist.json', 'favorites.json', 'blacklist.json'], function(result) {
        if (!result['watchlist.json']) {
            chrome.storage.local.set({ 'watchlist.json': { users: [] } });
        }
        if (!result['favorites.json']) {
            chrome.storage.local.set({ 'favorites.json': { users: [] } });
        }
        if (!result['blacklist.json']) {
            chrome.storage.local.set({ 'blacklist.json': { users: [] } });
        }
    });
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'saveNote') {
        const { username, text, noteType, targetList } = message.data;
        
        // 读取目标文件
        fetch(chrome.runtime.getURL(`data/${targetList}`))
            .then(r => r.json())
            .then(data => {
                // 移除其他列表中的记录
                ['normal_list.json', 'yellow_list.json', 'black_list.json'].forEach(file => {
                    if (file !== targetList) {
                        fetch(chrome.runtime.getURL(`data/${file}`))
                            .then(r => r.json())
                            .then(fileData => {
                                fileData.users = fileData.users.filter(u => u.user_id !== username);
                                chrome.storage.local.set({ [file]: fileData });
                            });
                    }
                });

                // 添加到目标列表
                data.users = data.users.filter(u => u.user_id !== username);
                data.users.push({
                    user_id: username,
                    tag: text
                });

                // 保存更新后的数据
                chrome.storage.local.set({ [targetList]: data }, () => {
                    sendResponse({ success: true });
                });
            })
            .catch(error => {
                console.error('保存数据失败:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // 保持消息通道开放
    }
}); 