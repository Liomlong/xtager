<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xtager - 隐私政策</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }

        .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        h1 {
            color: #1da1f2;
            margin-bottom: 24px;
            font-size: 28px;
            text-align: center;
        }

        h2 {
            color: #0f1419;
            margin: 32px 0 16px;
            font-size: 20px;
            border-bottom: 2px solid #eee;
            padding-bottom: 8px;
        }

        p {
            margin-bottom: 16px;
            color: #536471;
        }

        ul {
            margin-bottom: 16px;
            padding-left: 24px;
        }

        li {
            margin-bottom: 8px;
            color: #536471;
        }

        .highlight {
            background: #e8f5fd;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 16px;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            color: #536471;
            font-size: 14px;
        }

        @media (max-width: 600px) {
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Xtager 隐私政策</h1>

        <div class="highlight">
            <p>Xtager 是一个纯本地的 Twitter/X 用户备注工具，我们高度重视用户的隐私保护。本隐私政策说明了我们如何处理您的数据。</p>
        </div>

        <h2>1. 数据收集与使用</h2>
        <ul>
            <li>不收集任何个人信息</li>
            <li>不追踪用户行为</li>
            <li>不使用任何分析工具</li>
            <li>不上传任何数据到服务器</li>
        </ul>

        <h2>2. 数据存储</h2>
        <ul>
            <li>所有数据均存储在用户本地浏览器中</li>
            <li>使用 chrome.storage.local API 进行存储</li>
            <li>不进行云端同步</li>
            <li>不与其他用户共享数据</li>
        </ul>

        <h2>3. 必需权限说明</h2>
        <p><strong>storage 权限：</strong></p>
        <ul>
            <li>用于在本地存储用户的备注数据</li>
            <li>仅限本地存储</li>
            <li>仅存储用户主动添加的备注信息</li>
        </ul>

        <p><strong>tabs 权限：</strong></p>
        <ul>
            <li>仅用于打开备注管理页面</li>
            <li>不会读取或修改其他标签页的内容</li>
        </ul>

        <p><strong>host_permissions：</strong></p>
        <ul>
            <li>仅限 twitter.com 和 x.com 域名</li>
            <li>用于在网站上显示备注功能</li>
            <li>添加备注按钮和显示备注内容</li>
        </ul>

        <h2>4. 数据安全</h2>
        <ul>
            <li>数据完全存储在本地</li>
            <li>不进行网络传输</li>
            <li>不与第三方共享</li>
            <li>用户可随时导出或删除数据</li>
        </ul>

        <h2>5. 用户权利</h2>
        <ul>
            <li>随时查看所有备注内容</li>
            <li>导出数据进行备份</li>
            <li>编辑或删除任何备注</li>
            <li>卸载扩展会自动清除所有数据</li>
        </ul>

        <h2>6. 隐私政策更新</h2>
        <p>如本隐私政策有任何变更，我们将：</p>
        <ul>
            <li>通过扩展更新时通知用户</li>
            <li>重大变更将要求用户重新确认</li>
        </ul>

        <div class="footer">
            <p>最后更新时间：<?php echo date('Y年m月d日'); ?></p>
            <p>如有任何隐私相关问题或疑虑，请通过以下方式联系我们：</p>
            <p>[您的联系方式]</p>
        </div>
    </div>
</body>
</html> 