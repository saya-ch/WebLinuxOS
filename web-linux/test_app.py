import os
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = '/workspace/web-linux/screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def test_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        page.goto('http://localhost:5173/')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        
        page.screenshot(path=f'{SCREENSHOT_DIR}/01-desktop.png', full_page=False)
        print("✅ 桌面截图完成")
        
        icons = page.locator('.desktop-icon')
        icon_count = icons.count()
        print(f"📱 桌面图标数量: {icon_count}")
        
        taskbar = page.locator('.taskbar')
        taskbar_visible = taskbar.is_visible()
        print(f"📌 任务栏可见: {taskbar_visible}")
        
        page.locator('.taskbar-launcher').click()
        page.wait_for_timeout(500)
        
        launcher = page.locator('.launcher')
        launcher_visible = launcher.is_visible()
        print(f"🚀 启动器可见: {launcher_visible}")
        
        if launcher_visible:
            page.screenshot(path=f'{SCREENSHOT_DIR}/02-launcher.png', full_page=False)
            print("✅ 启动器截图完成")
            
            categories = page.locator('.launcher-category')
            cat_count = categories.count()
            print(f"📂 启动器分类数量: {cat_count}")
            
            app_items = page.locator('.launcher-app-item')
            app_count = app_items.count()
            print(f"📱 分类中应用数量: {app_count}")
        
        page.locator('.launcher-overlay').click()
        page.wait_for_timeout(500)
        
        page.locator('.desktop-icon').first.dblclick()
        page.wait_for_timeout(1000)
        
        windows = page.locator('.window')
        window_count = windows.count()
        print(f"🪟 打开窗口数量: {window_count}")
        
        if window_count > 0:
            page.screenshot(path=f'{SCREENSHOT_DIR}/03-file-manager.png', full_page=False)
            print("✅ 文件管理器截图完成")
            
            page.locator('.window-titlebar-button.close').click()
            page.wait_for_timeout(500)
        
        page.locator('.desktop-icon').nth(1).dblclick()
        page.wait_for_timeout(1000)
        page.screenshot(path=f'{SCREENSHOT_DIR}/04-terminal.png', full_page=False)
        print("✅ 终端截图完成")
        
        page.locator('.window-titlebar-button.close').click()
        page.wait_for_timeout(500)
        
        page.locator('.desktop-icon').nth(2).dblclick()
        page.wait_for_timeout(1000)
        page.screenshot(path=f'{SCREENSHOT_DIR}/05-text-editor.png', full_page=False)
        print("✅ 文本编辑器截图完成")
        
        page.locator('.window-titlebar-button.close').click()
        page.wait_for_timeout(500)
        
        app_ids_to_test = [
            'calculator', 'calendar', 'clock', 'weather', 
            'system-monitor', 'settings', 'notepad',
            'music-player', 'paint', 'code-editor',
            'browser', 'task-manager', 'email', 'chat',
            'notes', 'todo-list', 'contacts', 'spreadsheet',
            'presentation', 'dictionary', 'translator', 'password-manager',
            'software-center', 'disk-usage', 'network-monitor',
            'game-snake', 'game-tetris', 'help', 'about'
        ]
        
        passed = 0
        failed = 0
        
        for app_id in app_ids_to_test:
            try:
                page.locator('.taskbar-launcher').click()
                page.wait_for_timeout(300)
                
                page.locator('.launcher-search').fill(app_id)
                page.wait_for_timeout(300)
                
                app_items = page.locator('.launcher-app-item')
                if app_items.count() > 0:
                    app_items.first.click()
                    page.wait_for_timeout(800)
                    
                    windows = page.locator('.window')
                    if windows.count() > 0:
                        passed += 1
                    else:
                        failed += 1
                        print(f"  ❌ {app_id} 窗口未打开")
                    
                    close_btns = page.locator('.window-titlebar-button.close')
                    if close_btns.count() > 0:
                        close_btns.first.click()
                        page.wait_for_timeout(300)
                else:
                    page.locator('.launcher-overlay').click()
                    page.wait_for_timeout(300)
            except Exception as e:
                failed += 1
                print(f"  ❌ {app_id}: {str(e)[:60]}")
        
        print(f"\n📊 测试结果: {passed} 通过, {failed} 失败, 共 {passed + failed} 个应用")
        print(f"🎯 成功率: {passed / (passed + failed) * 100:.1f}%")
        
        page.screenshot(path=f'{SCREENSHOT_DIR}/06-final-desktop.png', full_page=False)
        print("✅ 最终桌面截图完成")
        
        browser.close()
        return passed, failed

if __name__ == '__main__':
    passed, failed = test_app()
    print(f"\n{'='*50}")
    print(f"总通过: {passed}, 总失败: {failed}")