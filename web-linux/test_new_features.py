#!/usr/bin/env python3
"""WebLinuxOS 测试脚本 - 验证新功能"""

from playwright.sync_api import sync_playwright
import time

def test_weblinuxos():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        print("🔍 正在加载 WebLinuxOS...")
        page.goto('http://localhost:5173/WebLinuxOS/')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        # 截图初始页面
        page.screenshot(path='/tmp/weblinuxos-home.png', full_page=True)
        print("✅ 主页加载成功")
        
        # 检查页面标题
        title = page.title()
        print(f"📄 页面标题: {title}")
        
        # 检查桌面元素
        desktop = page.locator('.desktop, [class*="desktop"]')
        print(f"🖥️  桌面元素: {'存在' if desktop.count() > 0 else '未找到'}")
        
        # 检查任务栏
        taskbar = page.locator('.taskbar, [class*="taskbar"]')
        print(f"📊 任务栏: {'存在' if taskbar.count() > 0 else '未找到'}")
        
        # 检查启动器
        launcher_btn = page.locator('[class*="launcher"], [class*="start-menu"]')
        print(f"🚀 启动器: {'存在' if launcher_btn.count() > 0 else '未找到'}")
        
        # 尝试打开终端
        print("\n🔧 测试打开终端...")
        page.keyboard.press('Control+t')
        time.sleep(1)
        
        # 截图
        page.screenshot(path='/tmp/weblinuxos-terminal.png', full_page=True)
        print("✅ 终端截图已保存")
        
        # 尝试使用快捷键打开应用
        print("\n🔍 测试搜索功能...")
        page.keyboard.press('Control+k')
        time.sleep(0.5)
        page.screenshot(path='/tmp/weblinuxos-search.png')
        print("✅ 搜索面板截图已保存")
        
        # 检查控制台错误
        errors = []
        page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
        
        # 等待页面稳定
        time.sleep(3)
        
        # 截图最终状态
        page.screenshot(path='/tmp/weblinuxos-final.png', full_page=True)
        print("\n📸 所有截图已保存到 /tmp/ 目录")
        
        # 检查是否有错误
        if errors:
            print(f"\n⚠️  控制台错误 ({len(errors)} 条):")
            for err in errors[:5]:
                print(f"  - {err[:100]}")
        else:
            print("\n✅ 无控制台错误")
        
        browser.close()
        return True

if __name__ == '__main__':
    try:
        success = test_weblinuxos()
        print("\n" + ("🎉 测试通过!" if success else "❌ 测试失败"))
    except Exception as e:
        print(f"\n❌ 测试异常: {e}")
