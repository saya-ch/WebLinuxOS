import os
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = '/workspace/WebLinuxOS/test-screenshots'
TARGET_URL = 'http://localhost:5173/WebLinuxOS/'
VIEWPORT = {'width': 1920, 'height': 1080}

APPS = [
    ('files', '文件管理器'),
    ('calculator', '计算器'),
    ('settings', '设置'),
    ('browser', '浏览器'),
    ('terminal', '终端'),
]


def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    results = []

    with sync_playwright() as p:
        print('[1/9] 启动浏览器 (headless=False, 1920x1080)...')
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport=VIEWPORT)

        console_errors = []

        def on_console(msg):
            if msg.type == 'error':
                console_errors.append(msg.text)

        page.on('console', on_console)

        print(f'[2/9] 导航到 {TARGET_URL} ...')
        page.goto(TARGET_URL)
        page.wait_for_load_state('networkidle')

        print('[3/9] 等待启动动画完成 (4秒)...')
        page.wait_for_timeout(4000)

        print('[4/9] 截图初始桌面...')
        desktop_path = os.path.join(SCREENSHOT_DIR, '01-desktop.png')
        page.screenshot(path=desktop_path)
        results.append({
            'step': '初始桌面',
            'success': True,
            'screenshot': desktop_path,
            'detail': '页面加载完成，桌面截图已保存',
        })
        print(f'  截图已保存: {desktop_path}')

        print('[5/9] 通过 JavaScript API 打开各个应用...')
        for i, (app_id, app_name) in enumerate(APPS, start=2):
            print(f'  [{i+3}/9] 打开 {app_name} ({app_id})...')
            try:
                page.evaluate(f"window.WebLinuxOS.openApp('{app_id}')")
                page.wait_for_timeout(800)

                shot_path = os.path.join(SCREENSHOT_DIR, f'{i:02d}-{app_id}.png')
                page.screenshot(path=shot_path)

                window_count = page.locator('.window').count()
                results.append({
                    'step': f'打开{app_name}',
                    'app_id': app_id,
                    'success': True,
                    'screenshot': shot_path,
                    'detail': f'window.WebLinuxOS.openApp("{app_id}") 执行成功，当前窗口数: {window_count}',
                })
                print(f'    ✓ 成功，窗口数: {window_count}，截图: {shot_path}')

            except Exception as e:
                results.append({
                    'step': f'打开{app_name}',
                    'app_id': app_id,
                    'success': False,
                    'screenshot': None,
                    'detail': str(e),
                })
                print(f'    ✗ 失败: {e}')

                shot_path = os.path.join(SCREENSHOT_DIR, f'{i:02d}-{app_id}-error.png')
                try:
                    page.screenshot(path=shot_path)
                except Exception:
                    pass

        print('[8/9] 检查控制台错误...')
        if console_errors:
            print(f'  发现 {len(console_errors)} 个控制台错误:')
            for err in console_errors:
                print(f'    - {err[:200]}')
        else:
            print('  未发现控制台错误')

        print('[9/9] 关闭浏览器...')
        browser.close()

    print('\n' + '=' * 60)
    print('测试结果汇总')
    print('=' * 60)
    for r in results:
        status = '✓' if r['success'] else '✗'
        shot = r['screenshot'] or '无'
        print(f"  [{status}] {r['step']}")
        print(f"      截图: {shot}")
        print(f"      详情: {r['detail']}")

    passed = sum(1 for r in results if r['success'])
    failed = len(results) - passed
    print(f'\n总计: {passed} 通过, {failed} 失败, 共 {len(results)} 项')

    return 0 if failed == 0 else 1


if __name__ == '__main__':
    exit_code = main()
    exit(exit_code)