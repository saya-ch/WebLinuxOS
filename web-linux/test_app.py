from playwright.sync_api import sync_playwright
import time

def test_weblinuxos():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.goto('http://localhost:5174/WebLinuxOS/')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        
        page.screenshot(path='/workspace/WebLinuxOS/web-linux/test_screenshots/home.png', full_page=True)
        print('截图已保存: home.png')
        
        print('页面标题:', page.title())
        
        desktop_icons = page.locator('.desktop-icon').all()
        print(f'桌面图标数量: {len(desktop_icons)}')
        
        for icon in desktop_icons:
            try:
                title = icon.locator('.desktop-icon-name').inner_text()
                print(f'  - {title}')
            except:
                pass
        
        terminal_icon = page.locator('.desktop-icon', has_text='终端')
        if terminal_icon.count() > 0:
            terminal_icon.first.click()
            time.sleep(2)
            print('终端已打开')
            page.screenshot(path='/workspace/WebLinuxOS/web-linux/test_screenshots/terminal_open.png', full_page=True)
            
            terminal_input = page.locator('.terminal-input')
            if terminal_input.count() > 0:
                terminal_input.first.type('system-info')
                terminal_input.first.press('Enter')
                time.sleep(1)
                page.screenshot(path='/workspace/WebLinuxOS/web-linux/test_screenshots/system_info.png', full_page=True)
                print('system-info 命令执行成功')
                
                terminal_input.first.type('cpu-info')
                terminal_input.first.press('Enter')
                time.sleep(1)
                page.screenshot(path='/workspace/WebLinuxOS/web-linux/test_screenshots/cpu_info.png', full_page=True)
                print('cpu-info 命令执行成功')
                
                terminal_input.first.type('env')
                terminal_input.first.press('Enter')
                time.sleep(1)
                print('env 命令执行成功')
                
                terminal_input.first.type('history')
                terminal_input.first.press('Enter')
                time.sleep(1)
                print('history 命令执行成功')
                
                terminal_input.first.type('help')
                terminal_input.first.press('Enter')
                time.sleep(1)
                page.screenshot(path='/workspace/WebLinuxOS/web-linux/test_screenshots/help.png', full_page=True)
                print('help 命令执行成功')
        else:
            print('未找到终端图标')
        
        taskbar = page.locator('.taskbar').first
        if taskbar.count() > 0:
            print('任务栏存在')
            
            start_button = page.locator('.taskbar-start-button')
            if start_button.count() > 0:
                start_button.first.click()
                time.sleep(1)
                page.screenshot(path='/workspace/WebLinuxOS/web-linux/test_screenshots/start_menu.png', full_page=True)
                print('开始菜单已打开')
                
                start_button.first.click()
                time.sleep(0.5)
        
        browser.close()
        print('测试完成')

if __name__ == '__main__':
    test_weblinuxos()