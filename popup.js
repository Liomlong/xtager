document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 只从 chrome.storage.local 获取数据
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

        // 更新统计数据
        const normalCount = result['normal_list.json'].users.length;
        const yellowCount = result['yellow_list.json'].users.length;
        const blackCount = result['black_list.json'].users.length;

        // 更新显示
        document.getElementById('normalCount').textContent = normalCount;
        document.getElementById('yellowCount').textContent = yellowCount;
        document.getElementById('blackCount').textContent = blackCount;

        // 绑定打开管理页面按钮事件
        const openManagerBtn = document.getElementById('openManager');
        if (openManagerBtn) {
            openManagerBtn.addEventListener('click', function() {
                window.open('manager.html', '_blank');
            });
        }

    } catch (error) {
        console.error('加载数据失败:', error);
        // 显示错误状态
        document.getElementById('normalCount').textContent = '-';
        document.getElementById('yellowCount').textContent = '-';
        document.getElementById('blackCount').textContent = '-';
    }
}); 