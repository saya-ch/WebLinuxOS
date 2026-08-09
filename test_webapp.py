from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    
    print("正在加载页面...")
    page.goto('http://localhost:5173/WebLinuxOS/', wait_until='networkidle', timeout=30000)
    
    print("页面加载完成，等待启动动画结束...")
    page.wait_for_timeout(5000)
    
    # 截图查看桌面
    page.screenshot(path='/workspace/WebLinuxOS/web-linux/desktop_test.png', full_page=True)
    print("桌面截图已保存")
    
    # 检查页面标题
    title = page.title()
    print(f"页面标题: {title}")
    
    # 检查版本号
    content = page.content()
    if 'v71' in content:
        print("✓ 版本号 v71 显示正确")
    else:
        print("✗ 版本号可能不正确")
    
    # 检查桌面元素
    try:
        desktop = page.locator('.desktop')
        if desktop.count() > 0:
            print("✓ 桌面元素存在")
        else:
            print("✗ 桌面元素未找到")
    except:
        print("桌面元素检查失败")
    
    # 检查任务栏
    try:
        taskbar = page.locator('.taskbar')
        if taskbar.count() > 0:
            print("✓ 任务栏存在")
        else:
            print("✗ 任务栏未找到")
    except:
        print("任务栏检查失败")
    
    # 检查AI桌面助手应用是否存在
    try:
        if 'AI 桌面助手' in content or 'ai-desktop-assistant' in content:
            print("✓ AI 桌面助手应用已注册")
        else:
            print("✗ AI 桌面助手可能未正确注册")
    except:
        print("AI 桌面助手检查失败")
    
    # 检查终端API命令文件是否存在
    api_commands_path = '/workspace/WebLinuxOS/web-linux/src/apps/terminal/apiCommands.ts'
    if os.path.exists(api_commands_path):
        with open(api_commands_path, 'r') as f:
            file_content = f.read()
            commands = ['stock', 'currency', 'translate', 'joke', 'quote', 'hackernews', 'news', 'github', 'color', 'uuid', 'base64', 'hash', 'qr']
            found = [cmd for cmd in commands if f"registerCommand('{cmd}'" in file_content]
            print(f"✓ 终端API命令文件存在，已注册命令: {len(found)}/13")
            if found:
                print(f"  已找到命令: {', '.join(found)}")
    else:
        print("✗ 终端API命令文件不存在")
    
    print("\n测试完成！")
    browser.close()
