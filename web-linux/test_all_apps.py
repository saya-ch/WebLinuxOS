import os
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = '/workspace/web-linux/screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

ALL_APPS = [
    'files', 'terminal', 'text-editor', 'browser', 'calculator',
    'calendar', 'clock', 'weather', 'system-monitor', 'settings',
    'notepad', 'image-viewer', 'music-player', 'video-player',
    'pdf-viewer', 'code-editor', 'package-manager', 'software-center',
    'disk-usage', 'task-manager', 'process-monitor', 'network-monitor',
    'firewall', 'user-manager', 'screenshot', 'paint', 'spreadsheet',
    'presentation', 'email', 'chat', 'contacts', 'notes', 'todo-list',
    'password-manager', 'backup-tool', 'archive-manager', 'disk-utility',
    'log-viewer', 'character-map', 'font-viewer', 'dictionary',
    'translator', 'maps', 'camera', 'screen-recorder', 'sound-recorder',
    'bluetooth', 'wifi', 'power', 'about', 'help', 'command-ref',
    'color-picker', 'magnifier', 'game-snake', 'game-tetris'
]

def test_all_apps():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        page.goto('http://localhost:5173/')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        
        page.screenshot(path=f'{SCREENSHOT_DIR}/01-desktop.png')
        print("桌面截图完成")
        
        icons = page.locator('.desktop-icon')
        print(f"桌面图标: {icons.count()}个")
        print(f"任务栏可见: {page.locator('.taskbar').is_visible()}")
        
        page.locator('.taskbar-launcher').click()
        page.wait_for_timeout(500)
        page.screenshot(path=f'{SCREENSHOT_DIR}/02-launcher.png')
        print(f"启动器: {page.locator('.launcher').is_visible()}")
        print(f"分类: {page.locator('.launcher-category').count()}个")
        
        page.locator('.launcher-overlay').click()
        page.wait_for_timeout(500)
        
        passed = []
        failed = []
        
        for i, app_id in enumerate(ALL_APPS):
            try:
                page.locator('.taskbar-launcher').click()
                page.wait_for_timeout(300)
                
                search_input = page.locator('.launcher-search')
                search_input.fill('')
                search_input.fill(app_id)
                page.wait_for_timeout(400)
                
                app_items = page.locator('.launcher-app-item')
                if app_items.count() > 0:
                    app_items.first.click()
                    page.wait_for_timeout(600)
                    
                    windows = page.locator('.window')
                    if windows.count() > 0:
                        passed.append(app_id)
                    else:
                        failed.append(app_id)
                    
                    close_btns = page.locator('.window-titlebar-button.close')
                    if close_btns.count() > 0:
                        close_btns.first.click()
                        page.wait_for_timeout(300)
                else:
                    page.locator('.launcher-overlay').click()
                    page.wait_for_timeout(300)
            except Exception as e:
                failed.append(app_id)
        
        print(f"\n{'='*60}")
        print(f"测试结果: {len(passed)}通过, {len(failed)}失败, 共{len(ALL_APPS)}个应用")
        print(f"成功率: {len(passed)/len(ALL_APPS)*100:.1f}%")
        
        if failed:
            print(f"\n失败应用: {', '.join(failed)}")
        
        page.screenshot(path=f'{SCREENSHOT_DIR}/03-final.png')
        
        browser.close()
        return passed, failed

if __name__ == '__main__':
    passed, failed = test_all_apps()
    
    if failed:
        exit(1)
    else:
        print("\n所有应用测试通过!")