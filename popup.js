document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 从 chrome.storage.local 获取数据
        const result = await chrome.storage.local.get([
            'normal_list.json',
            'yellow_list.json',
            'black_list.json'
        ]);

        // 更新统计数据
        const normalCount = (result['normal_list.json']?.users || []).length;
        const yellowCount = (result['yellow_list.json']?.users || []).length;
        const blackCount = (result['black_list.json']?.users || []).length;

        document.getElementById('normalCount').textContent = normalCount;
        document.getElementById('yellowCount').textContent = yellowCount;
        document.getElementById('blackCount').textContent = blackCount;

        // 绑定按钮事件
        document.getElementById('openManager').addEventListener('click', function() {
            chrome.tabs.create({url: 'manager.html'});
        });

        document.getElementById('exportData').addEventListener('click', function() {
            const data = {
                normal_list: result['normal_list.json'] || { users: [] },
                yellow_list: result['yellow_list.json'] || { users: [] },
                black_list: result['black_list.json'] || { users: [] }
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `xtager_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // 添加数据更新监听
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            if (namespace === 'local') {
                // 当存储数据变化时更新显示
                for (let key in changes) {
                    if (key === 'normal_list.json') {
                        document.getElementById('normalCount').textContent = 
                            changes[key].newValue?.users?.length || 0;
                    } else if (key === 'yellow_list.json') {
                        document.getElementById('yellowCount').textContent = 
                            changes[key].newValue?.users?.length || 0;
                    } else if (key === 'black_list.json') {
                        document.getElementById('blackCount').textContent = 
                            changes[key].newValue?.users?.length || 0;
                    }
                }
            }
        });

    } catch (error) {
        console.error('加载数据失败:', error);
    }
}); 