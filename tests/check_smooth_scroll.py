"""Exercise actual Lenis scrolling and preserve the original design for this PR."""
import functools
import hashlib
import http.server
import json
import os
from pathlib import Path
import shutil
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'scroll-qa'
OUT.mkdir(exist_ok=True)
REPORT = {'checks': [], 'screens': {}}

def check(name, passed, details=None):
    REPORT['checks'].append({'name': name, 'passed': bool(passed), 'details': details})
    print(('PASS ' if passed else 'FAIL ') + name, details or '', flush=True)
    if not passed:
        raise AssertionError(name + ': ' + str(details))

def blob_sha(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = os.environ.get('BASE_URL', f'http://127.0.0.1:{server.server_port}/').rstrip('/') + '/'
REPORT['url'] = BASE

def ready(page):
    page.wait_for_function('window.portfolioScroll && window.portfolioScroll.ready', timeout=30000)
    page.evaluate('document.fonts.ready')
    page.wait_for_timeout(1000)

def nav_diagnostics(page):
    return page.evaluate('''() => {
        const e = document.querySelector('.menu-toggle'), r = e.getBoundingClientRect();
        const s = getComputedStyle(e), center = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        return {width:innerWidth, viewport:visualViewport.width, scale:visualViewport.scale,
          button:r.toJSON(), header:document.querySelector('[data-nav]').getBoundingClientRect().toJSON(),
          display:s.display, visibility:s.visibility, opacity:s.opacity, pointerEvents:s.pointerEvents,
          transform:s.transform, zIndex:s.zIndex, center:center && center.outerHTML, html:e.outerHTML};
    }''')

def navigate(page, name):
    if page.locator('.menu-toggle').is_visible():
        try:
            page.locator('.menu-toggle').click(timeout=5000)
        except Exception:
            REPORT['menu_diagnostic'] = nav_diagnostics(page)
            print('MENU_DIAGNOSTIC', json.dumps(REPORT['menu_diagnostic']), flush=True)
            page.screenshot(path=str(OUT/'menu-failure.png'))
            raise
    page.locator('#primary-navigation a[href="#' + name + '"]').click()
    page.wait_for_timeout(1700)

def overflow(page):
    return page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')

try:
    # Limit one-time snapshot checks to this change; future resume edits stay possible.
    preserve = os.environ.get('VERIFY_ORIGINALS') == '1' or os.environ.get('GITHUB_HEAD_REF') == 'enhancement/smooth-scroll-20260924'
    protected = {
        'styles.css': '78de70e559ed0193af7bb091509300831241fbbf',
        'script.js': 'e3efd6f9e0ac3138131c013cb231400f196e7e56',
        'CNAME': '2cb01a11c15a16d42a42590d182f281ba8e4c0d1',
        'abdul-azeez-resume.pdf': '56deed174544b354f222d027061f13a061e541e4',
        'favicon-aa.svg': '31eec0a1d800a3eaffb294f7f17e9be05017e669',
        'favicon.png': '6bc36f6898481d95ae792f48cd47c3d4f81ab747'
    }
    if preserve:
        for filename, expected in protected.items():
            check('Unchanged original file: ' + filename, blob_sha((ROOT/filename).read_bytes()) == expected)
    html = (ROOT/'index.html').read_text()
    for line in [
        '  <link rel="stylesheet" href="smooth-scroll.css?v=1">\n',
        '  <script defer src="https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js"></script>\n',
        '  <script defer src="smooth-scroll.js?v=1"></script>\n'
    ]:
        check('Exactly one integration tag: ' + line.strip(), html.count(line) == 1)
        html = html.replace(line, '')
    if preserve:
        check('Original HTML unchanged except three asset tags', blob_sha(html.encode()) == '49118d92bf5a77e2fa688f886ffa57516b28e591')
    source = OUT/'source'; source.mkdir(exist_ok=True)
    for filename in ['index.html','styles.css','script.js','smooth-scroll.js','smooth-scroll.css','aurora.css','aurora.js','text-flow.js','favicon-aa.svg']:
        shutil.copyfile(ROOT/filename, source/filename)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        for name, w, h, touch in [('small-mobile',320,740,True),('desktop',1440,900,False),('wide',1920,1080,False),('tablet',768,1024,False),('mobile',390,844,True)]:
            context = browser.new_context(viewport={'width':w,'height':h}, is_mobile=touch, has_touch=touch, device_scale_factor=1)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            response = page.goto(BASE, wait_until='domcontentloaded', timeout=90000)
            check(name + ': page responds', response.ok)
            ready(page)
            state = page.evaluate('window.portfolioScroll')
            REPORT['screens'][name] = state
            check(name + ': expected scroll mode', state['mode'] == ('native' if touch else 'smooth'), state)
            check(name + ': original hero visible', page.locator('#hero-title').is_visible())
            check(name + ': original section count', page.locator('main > section[id]').count() == 7)
            check(name + ': no horizontal overflow', overflow(page))
            check(name + ': Silk Aurora background color', page.evaluate("getComputedStyle(document.body).backgroundColor") == 'rgb(5, 7, 18)')
            check(name + ': Silk Aurora renderer ready', page.evaluate("window.silkAurora && window.silkAurora.ready"))
            check(name + ': project cards expose repository links', page.locator('#projects .project-card .project-link').count() == page.locator('#projects .project-card').count())
            if w == 320:
                REPORT['small_before_screenshot'] = nav_diagnostics(page)
            page.screenshot(path=str(OUT/(name+'-hero.png')))
            if not touch:
                check(name + ': real Lenis loaded', page.evaluate('typeof window.Lenis === "function"'))
                check(name + ': same Portfolio 2 easing', state['lerp'] == 0.085)
                page.mouse.move(w/2, h/2)
                page.evaluate('''() => {
                    window.scrollSamples = [];
                    function sample() {
                        scrollSamples.push(scrollY);
                        if (scrollSamples.length < 48) requestAnimationFrame(sample);
                    }
                    requestAnimationFrame(sample);
                }''')
                page.mouse.wheel(0, 620)
                page.wait_for_timeout(1700)
                samples = page.evaluate('window.scrollSamples')
                check(name + ': wheel moves through intermediate positions', len(set(samples)) > 6 and max(samples) > 100, samples)
                check(name + ': wheel reaches expected destination', abs(page.evaluate('scrollY') - 620) < 8)
                check(name + ': scroll progress still updates', page.locator('.scroll-progress span').evaluate('(e) => parseFloat(e.style.width) > 0'))
            navigate(page, 'about')
            check(name + ': navigation hash updated', page.evaluate('location.hash') == '#about')
            check(name + ': menu closes after link', page.locator('.menu-toggle').get_attribute('aria-expanded') == 'false')
            check(name + ': navigation clears fixed header', page.locator('#about').evaluate('(e) => e.getBoundingClientRect().top >= document.querySelector("[data-nav]").getBoundingClientRect().bottom - 2'))
            check(name + ': GSAP reveal leaves content visible', page.locator('#about .reveal').evaluate('(e)=>getComputedStyle(e).opacity === "1"'))
            navigate(page, 'projects')
            check(name + ': projects navigation works', page.evaluate('location.hash') == '#projects')
            check(name + ': active nav preserved', page.locator('#primary-navigation a[href="#projects"]').evaluate('(e)=>e.classList.contains("active")'))
            if not touch:
                check(name + ': anchor transfers keyboard focus', page.evaluate('document.activeElement.id') == 'projects')
            page.go_back(wait_until='domcontentloaded'); page.wait_for_timeout(1200)
            check(name + ': browser Back restores section', page.evaluate('location.hash') == '#about' and abs(page.locator('#about').bounding_box()['y'] - (88 if w<=900 else 96)) < 8)
            page.go_forward(wait_until='domcontentloaded'); page.wait_for_timeout(1200)
            check(name + ': browser Forward restores section', page.evaluate('location.hash') == '#projects')
            page.screenshot(path=str(OUT/(name+'-projects.png')))
            if name == 'desktop':
                old_y = page.evaluate('scrollY')
                page.keyboard.press('PageDown'); page.wait_for_timeout(900)
                check('Desktop: PageDown remains usable', page.evaluate('scrollY') > old_y + 100)
                page.keyboard.press('Home'); page.wait_for_timeout(900)
                check('Desktop: Home remains usable', page.evaluate('scrollY') < 5)
                page.evaluate('document.activeElement.blur()')
                page.mouse.wheel(0, 200); page.wait_for_timeout(1200)
                check('Desktop: wheel still works after keyboard', page.evaluate('scrollY') > 100)
            page.locator('footer a[href="#home"]').click(); page.wait_for_timeout(1800)
            check(name + ': back to top works', page.evaluate('scrollY') < 5)
            check(name + ': Silk Aurora canvas retained', page.locator('#network-background').is_visible())
            check(name + ': GSAP clean flow initialized or safely reduced', page.evaluate("window.textFlow && window.textFlow.ready"))
            check(name + ': no unhandled JavaScript errors', not errors, errors)
            check(name + ': no overflow after interaction', overflow(page))
            context.close()
        context = browser.new_context(viewport={'width':1440,'height':900}, reduced_motion='reduce')
        page = context.new_page(); page.goto(BASE, wait_until='domcontentloaded'); ready(page)
        check('Reduced motion: no smoothing', page.evaluate('window.portfolioScroll.mode') == 'native')
        check('Reduced motion: Aurora is paused', page.evaluate("window.silkAurora && window.silkAurora.paused"))
        check('Reduced motion: text flow disabled', page.evaluate("window.textFlow && window.textFlow.ready && !window.textFlow.enabled"))
        check('Reduced motion: native CSS is instant', page.evaluate('getComputedStyle(document.documentElement).scrollBehavior') == 'auto')
        page.keyboard.press('Tab')
        check('Keyboard: skip link first', page.locator('.skip-link').evaluate('(e)=>document.activeElement===e'))
        page.keyboard.press('Enter')
        check('Keyboard: skip link navigates', page.evaluate('location.hash') == '#main-content')
        page.emulate_media(reduced_motion='no-preference'); page.wait_for_timeout(100)
        check('Preference change: smoothing can start', page.evaluate('window.portfolioScroll.mode') == 'smooth')
        page.emulate_media(reduced_motion='reduce'); page.wait_for_timeout(100)
        check('Preference change: smoothing is destroyed', page.evaluate('window.portfolioScroll.mode') == 'native' and not page.locator('html').evaluate('(e)=>e.classList.contains("lenis")'))
        context.close()
        context = browser.new_context(viewport={'width':1440,'height':900})
        context.route('https://cdn.jsdelivr.net/**', lambda r: r.abort())
        page = context.new_page(); page.goto(BASE, wait_until='domcontentloaded'); ready(page)
        check('Blocked CDN: native fallback', page.evaluate('window.portfolioScroll.mode') == 'native')
        check('Blocked CDN: local Aurora still works', page.evaluate("window.silkAurora && window.silkAurora.ready"))
        check('Blocked CDN: text flow fails safely', page.evaluate("window.textFlow && window.textFlow.ready && !window.textFlow.enabled"))
        navigate(page, 'projects')
        check('Blocked CDN: navigation and content fallback work', page.evaluate('location.hash') == '#projects' and page.locator('#projects .reveal').evaluate('(e)=>getComputedStyle(e).opacity === "1"'))
        page.mouse.wheel(0, 300); page.wait_for_timeout(900)
        check('Blocked CDN: page remains scrollable', page.evaluate('scrollY') > 300 and overflow(page))
        page.screenshot(path=str(OUT/'cdn-fallback.png')); context.close()
        context = browser.new_context(viewport={'width':390,'height':844}, java_script_enabled=False)
        page = context.new_page(); page.goto(BASE, wait_until='domcontentloaded')
        check('No JavaScript: hero and native anchor present', page.locator('#hero-title').is_visible() and page.locator('.hero-actions a[href="#projects"]').is_visible())
        page.locator('.hero-actions a[href="#projects"]').click(force=True); page.wait_for_timeout(1200)
        check('No JavaScript: native navigation still works', page.evaluate('location.hash') == '#projects' and page.evaluate('scrollY') > 100)
        check('No JavaScript: no new overflow', overflow(page))
        pdf = context.request.get(BASE + 'abdul-azeez-resume.pdf')
        check('Resume URL serves the repository PDF', pdf.ok and pdf.body() == (ROOT/'abdul-azeez-resume.pdf').read_bytes())
        context.close()
        context = browser.new_context(viewport={'width':1440,'height':900})
        page = context.new_page(); page.goto(BASE+'#projects', wait_until='domcontentloaded'); ready(page)
        check('Direct deep link clears navigation', abs(page.locator('#projects').bounding_box()['y'] - 96) < 8)
        check('Direct deep link enables smoothing', page.evaluate('window.portfolioScroll.mode') == 'smooth')
        context.close(); browser.close()
    REPORT['passed'] = True
finally:
    (OUT/'report.json').write_text(json.dumps(REPORT, indent=2))
    server.shutdown()
