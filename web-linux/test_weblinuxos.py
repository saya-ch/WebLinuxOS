from playwright.sync_api import sync_playwright
import os

output_dir = './dogfood-output'
os.makedirs(f'{output_dir}/screenshots', exist_ok=True)
os.makedirs(f'{output_dir}/videos', exist_ok=True)

with sync_playwright() as p:
    print("启动浏览器...")
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    print("导航到WebLinuxOS...")
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)  # 等待启动动画

    print("截图初始状态...")
    page.screenshot(path=f'{output_dir}/screenshots/initial.png', full_page=False)

    print("检查页面标题...")
    title = page.title()
    print(f"页面标题: {title}")

    print("检查控制台错误...")
    console_errors = []
    def handle_console(msg):
        if msg.type == 'error':
            console_errors.append(msg.text)

    page.on('console', handle_console)
    page.reload()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    if console_errors:
        print(f"发现 {len(console_errors)} 个控制台错误:")
        for error in console_errors:
            print(f"  - {error}")
    else:
        print("未发现控制台错误")

    print("测试桌面交互...")
    desktop_icons = page.locator('.desktop-icon').all()
    print(f"找到 {len(desktop_icons)} 个桌面图标")

    if desktop_icons:
        desktop_icons[0].click()
        page.wait_for_timeout(500)
        page.screenshot(path=f'{output_dir}/screenshots/after_icon_click.png', full_page=False)

    print("测试右键菜单...")
    page.click('.desktop', button='right')
    page.wait_for_timeout(500)
    context_menu = page.locator('.context-menu').count()
    if context_menu > 0:
        print("右键菜单显示正常")
        page.screenshot(path=f'{output_dir}/screenshots/context_menu.png', full_page=False)
    page.keyboard.press('Escape')

    print("测试启动器 (Ctrl+Shift+L)...")
    page.keyboard.press('Control+Shift+L')
    page.wait_for_timeout(500)
    launcher = page.locator('.launcher, .start-menu, [class*="launcher"]').count()
    if launcher > 0:
        print("启动器打开正常")
        page.screenshot(path=f'{output_dir}/screenshots/launcher.png', full_page=False)
    page.keyboard.press('Escape')

    print("关闭浏览器...")
    browser.close()
    print("测试完成!")
