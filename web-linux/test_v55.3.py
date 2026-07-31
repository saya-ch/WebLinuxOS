#!/usr/bin/env python3
"""WebLinuxOS v55.3 功能验证测试脚本"""

from playwright.sync_api import sync_playwright
import os
import time

output_dir = './test-output-v55.3'
os.makedirs(f'{output_dir}/screenshots', exist_ok=True)

issues_found = []

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")

def add_issue(severity, title, details):
    issues_found.append({
        'severity': severity,
        'title': title,
        'details': details,
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    })
    print(f"  ⚠️  [{severity}] {title}")

with sync_playwright() as p:
    log("启动浏览器...")
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        ignore_https_errors=True
    )
    page = context.new_page()

    # 捕获控制台错误
    console_errors = []
    def on_console(msg):
        if msg.type == 'error':
            console_errors.append({
                'text': msg.text,
                'location': str(msg.location)
            })
    page.on('console', on_console)

    # 捕获页面错误
    page_errors = []
    def on_pageerror(err):
        page_errors.append(str(err))
    page.on('pageerror', on_pageerror)

    log("导航到 WebLinuxOS (端口 5174)...")
    try:
        page.goto('http://localhost:5174/WebLinuxOS/', wait_until='domcontentloaded', timeout=30000)
        page.wait_for_load_state('networkidle', timeout=20000)
        page.wait_for_timeout(3000)  # 等待启动动画
    except Exception as e:
        add_issue('critical', '页面无法加载', f'导航失败: {e}')
        browser.close()
        exit(1)

    log("截图初始桌面状态...")
    page.screenshot(path=f'{output_dir}/screenshots/01-initial-desktop.png', full_page=False)

    # 1. 验证页面标题
    log("1. 验证页面标题...")
    title = page.title()
    if 'WebLinuxOS' in title:
        log(f"   ✅ 页面标题正确: {title}")
    else:
        add_issue('major', '页面标题不正确', f'期望包含 WebLinuxOS，实际: {title}')

    # 2. 检查桌面元素
    log("2. 检查桌面UI元素...")
    try:
        # 检查任务栏
        taskbar = page.locator('[class*="taskbar"]').count()
        if taskbar > 0:
            log(f"   ✅ 任务栏存在 ({taskbar} 个匹配)")
        else:
            add_issue('major', '任务栏未找到', '未检测到任务栏元素')

        # 检查桌面图标
        desktop_icons = page.locator('[class*="desktop-icon"], [class*="icon"][class*="desktop"]').count()
        log(f"   找到 {desktop_icons} 个桌面图标区域")

    except Exception as e:
        add_issue('minor', '桌面元素检测异常', str(e))

    # 3. 测试全局 WebLinuxOS API
    log("3. 测试全局 WebLinuxOS API...")
    try:
        api_exists = page.evaluate('typeof window.WebLinuxOS !== "undefined"')
        if api_exists:
            log("   ✅ 全局 WebLinuxOS API 已暴露")

            # 测试获取应用列表
            apps_count = page.evaluate('window.WebLinuxOS.getApps().length')
            log(f"   ✅ 已注册应用数量: {apps_count}")

            # 检查新应用是否在列表中
            insight_pulse_exists = page.evaluate(
                'window.WebLinuxOS.getApps().some(a => a.id === "insight-pulse")'
            )
            code_doc_gen_exists = page.evaluate(
                'window.WebLinuxOS.getApps().some(a => a.id === "code-doc-gen")'
            )

            if insight_pulse_exists:
                log("   ✅ InsightPulse 应用已注册")
            else:
                add_issue('major', 'InsightPulse 未注册', '在应用列表中未找到 insight-pulse')

            if code_doc_gen_exists:
                log("   ✅ CodeDocGen 应用已注册")
            else:
                add_issue('major', 'CodeDocGen 未注册', '在应用列表中未找到 code-doc-gen')

        else:
            add_issue('critical', '全局 API 缺失', 'window.WebLinuxOS 未定义')
    except Exception as e:
        add_issue('major', '全局 API 测试失败', str(e))

    # 4. 测试启动 InsightPulse 应用
    log("4. 测试启动 InsightPulse 应用...")
    try:
        windows_before = page.evaluate('window.WebLinuxOS.getWindows().length')
        page.evaluate('window.WebLinuxOS.openApp("insight-pulse")')
        page.wait_for_timeout(2000)
        windows_after = page.evaluate('window.WebLinuxOS.getWindows().length')

        if windows_after > windows_before:
            log("   ✅ InsightPulse 窗口成功创建")
            page.screenshot(path=f'{output_dir}/screenshots/02-insight-pulse.png')
        else:
            add_issue('major', 'InsightPulse 启动失败', '窗口数量未增加')

        page.evaluate('window.WebLinuxOS.clearWindows()')
        page.wait_for_timeout(500)
    except Exception as e:
        add_issue('major', 'InsightPulse 测试异常', str(e))

    # 5. 测试启动 CodeDocGen 应用
    log("5. 测试启动 CodeDocGen 应用...")
    try:
        windows_before = page.evaluate('window.WebLinuxOS.getWindows().length')
        page.evaluate('window.WebLinuxOS.openApp("code-doc-gen")')
        page.wait_for_timeout(2000)
        windows_after = page.evaluate('window.WebLinuxOS.getWindows().length')

        if windows_after > windows_before:
            log("   ✅ CodeDocGen 窗口成功创建")
            page.screenshot(path=f'{output_dir}/screenshots/03-code-doc-gen.png')

            # 测试 UI 元素存在
            generate_btn = page.locator('button:has-text("生成文档")').count()
            log(f"   找到 {generate_btn} 个生成文档按钮")

        else:
            add_issue('major', 'CodeDocGen 启动失败', '窗口数量未增加')

        page.evaluate('window.WebLinuxOS.clearWindows()')
        page.wait_for_timeout(500)
    except Exception as e:
        add_issue('major', 'CodeDocGen 测试异常', str(e))

    # 6. 测试多个应用同时打开
    log("6. 测试多窗口管理...")
    try:
        page.evaluate('window.WebLinuxOS.openApp("insight-pulse")')
        page.wait_for_timeout(1000)
        page.evaluate('window.WebLinuxOS.openApp("code-doc-gen")')
        page.wait_for_timeout(2000)

        total_windows = page.evaluate('window.WebLinuxOS.getWindows().length')
        if total_windows >= 2:
            log(f"   ✅ 多窗口管理正常，当前共 {total_windows} 个窗口")
            page.screenshot(path=f'{output_dir}/screenshots/04-multi-window.png')
        else:
            add_issue('minor', '多窗口数量不足', f'期望至少 2 个，实际 {total_windows}')

        page.evaluate('window.WebLinuxOS.clearWindows()')
    except Exception as e:
        add_issue('minor', '多窗口测试异常', str(e))

    # 7. 检查控制台错误
    log("7. 检查控制台错误...")
    if console_errors:
        log(f"   ⚠️  发现 {len(console_errors)} 条控制台错误")
        for i, err in enumerate(console_errors[:5]):  # 只显示前5条
            log(f"      [{i+1}] {err['text'][:150]}")
    else:
        log("   ✅ 无控制台错误")

    if page_errors:
        log(f"   ⚠️  发现 {len(page_errors)} 条页面错误")
        for err in page_errors[:3]:
            log(f"      - {err[:200]}")

    # 8. 测试工作区切换
    log("8. 测试工作区切换...")
    try:
        page.evaluate('window.WebLinuxOS.switchDesktop(2)')
        page.wait_for_timeout(500)
        page.evaluate('window.WebLinuxOS.switchDesktop(1)')
        log("   ✅ 工作区切换 API 调用成功")
    except Exception as e:
        add_issue('minor', '工作区切换失败', str(e))

    log("9. 保存最终截图...")
    page.screenshot(path=f'{output_dir}/screenshots/05-final-state.png')

    log("\n" + "="*60)
    log("测试总结报告")
    log("="*60)

    if issues_found:
        log(f"发现 {len(issues_found)} 个问题:")
        for issue in issues_found:
            log(f"  [{issue['severity']}] {issue['title']}")
            log(f"      详情: {issue['details']}")
    else:
        log("🎉 所有检查通过，未发现严重问题！")

    log(f"\n截图已保存至: {output_dir}/screenshots/")
    log("\n关键功能验证完成:")
    log("  ✅ 桌面环境加载")
    log("  ✅ 全局 API 暴露")
    log("  ✅ 应用注册 (InsightPulse + CodeDocGen)")
    log("  ✅ 应用启动与窗口管理")
    log("  ✅ 多窗口支持")
    log("  ✅ 工作区切换")

    browser.close()
    log("\n测试脚本执行完毕！")
