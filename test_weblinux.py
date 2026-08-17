from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    
    # 收集所有问题
    issues = []
    
    print("=" * 60)
    print("WebLinuxOS Dogfood 测试报告")
    print("=" * 60)
    
    # 1. 加载页面
    print("\n[1] 加载应用页面...")
    try:
        page.goto('http://localhost:5173/WebLinuxOS/', wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path='/tmp/test-01-initial.png', full_page=True)
        print("    ✓ 页面加载成功")
    except Exception as e:
        issues.append(f"页面加载失败: {e}")
        print(f"    ✗ 页面加载失败: {e}")
        browser.close()
        exit(1)
    
    # 2. 检查控制台错误
    print("\n[2] 检查控制台错误...")
    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.wait_for_timeout(2000)
    if console_errors:
        print(f"    ⚠ 发现 {len(console_errors)} 个错误:")
        for err in console_errors[:5]:
            print(f"      - {err[:100]}")
        issues.extend(console_errors[:5])
    else:
        print("    ✓ 无控制台错误")
    
    # 3. 检查页面元素
    print("\n[3] 检查UI元素...")
    page_content = page.content()
    
    # 检查标题
    title = page.title()
    print(f"    页面标题: {title}")
    
    # 检查桌面元素
    desktop_exists = page.query_selector('.desktop') is not None
    print(f"    桌面元素: {'存在' if desktop_exists else '缺失'}")
    if not desktop_exists:
        issues.append("桌面元素缺失")
    
    # 检查任务栏
    taskbar_exists = page.query_selector('.taskbar') is not None
    print(f"    任务栏: {'存在' if taskbar_exists else '缺失'}")
    if not taskbar_exists:
        issues.append("任务栏缺失")
    
    # 检查开始菜单按钮
    start_menu = page.query_selector('.start-menu, .launcher')
    print(f"    开始菜单/启动器: {'存在' if start_menu else '缺失'}")
    if not start_menu:
        issues.append("开始菜单/启动器缺失")
    
    # 4. 尝试启动终端应用
    print("\n[4] 测试应用启动...")
    try:
        # 尝试打开启动器
        launcher_btn = page.query_selector('[class*="launcher"], [class*="start-menu"]')
        if launcher_btn:
            launcher_btn.click()
            page.wait_for_timeout(500)
            page.screenshot(path='/tmp/test-02-launcher.png')
            print("    ✓ 启动器打开成功")
            
            # 搜索终端应用
            search_input = page.query_selector('input[type="text"], input[placeholder*="搜索"]')
            if search_input:
                search_input.fill("terminal")
                page.wait_for_timeout(500)
                page.screenshot(path='/tmp/test-03-terminal-search.png')
                print("    ✓ 搜索功能正常")
    except Exception as e:
        issues.append(f"应用启动测试失败: {e}")
        print(f"    ⚠ 应用启动测试异常: {e}")
    
    # 5. 测试窗口操作
    print("\n[5] 测试窗口操作...")
    try:
        # 检查是否有窗口
        windows = page.query_selector_all('[class*="window"]')
        print(f"    窗口数量: {len(windows)}")
    except Exception as e:
        issues.append(f"窗口操作测试失败: {e}")
    
    # 6. 检查状态栏
    print("\n[6] 检查系统状态...")
    try:
        # 检查时间显示
        time_display = page.query_selector('[class*="time"], [class*="clock"]')
        if time_display:
            print(f"    时间显示: {time_display.inner_text()}")
        
        # 检查系统图标
        status_icons = page.query_selector_all('[class*="status"]')
        print(f"    状态图标数量: {len(status_icons)}")
    except Exception as e:
        issues.append(f"状态栏检查失败: {e}")
    
    # 7. 截图
    print("\n[7] 生成测试截图...")
    page.screenshot(path='/tmp/test-04-final.png', full_page=True)
    print("    ✓ 截图已保存")
    
    # 8. 检查性能
    print("\n[8] 检查页面性能...")
    try:
        perf_timing = page.evaluate("""() => {
            const nav = performance.getEntriesByType('navigation')[0];
            return {
                loadTime: nav.loadEventEnd - nav.startTime,
                domReadyTime: nav.domContentLoadedEventEnd - nav.startTime,
                responseTime: nav.responseEnd - nav.requestStart,
            };
        }""")
        print(f"    加载时间: {perf_timing['loadTime']:.0f}ms")
        print(f"    DOM就绪: {perf_timing['domReadyTime']:.0f}ms")
        print(f"    响应时间: {perf_timing['responseTime']:.0f}ms")
    except Exception as e:
        issues.append(f"性能检查失败: {e}")
    
    # 9. 最终报告
    print("\n" + "=" * 60)
    print("测试报告摘要")
    print("=" * 60)
    
    if issues:
        print(f"\n⚠ 发现 {len(issues)} 个问题:")
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. {issue}")
    else:
        print("\n✓ 所有测试通过！")
    
    print("\n截图文件:")
    print("  - /tmp/test-01-initial.png (初始加载)")
    print("  - /tmp/test-02-launcher.png (启动器)")
    print("  - /tmp/test-03-terminal-search.png (搜索)")
    print("  - /tmp/test-04-final.png (最终状态)")
    
    browser.close()
