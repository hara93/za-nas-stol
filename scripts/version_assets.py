"""Run before publishing: bind HTML and offline cache to exact CSS/JS content."""
import hashlib
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
assets = ['experience.css', 'shopping-data.js', 'shopping.js', 'spices.js']
html_path = root / 'index.html'
html = html_path.read_text()
urls = []
for name in assets:
    digest = hashlib.sha256((root / name).read_bytes()).hexdigest()[:12]
    url = f'{name}?v={digest}'
    html, count = re.subn(r'((?:src|href)=")' + re.escape(name) + r'(?:\?v=[a-z0-9]+)?"', lambda m: m[1] + url + '"', html)
    if count != 1:
        raise SystemExit(f'Expected one HTML reference for {name}, found {count}')
    urls.append('./' + url)
html_path.write_text(html)
core = ['./', './index.html', *urls, './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png']
worker_path = root / 'sw.js'
worker = re.sub(r'const CORE = .*?;', 'const CORE = ' + json.dumps(core) + ';', worker_path.read_text())
digest = hashlib.sha256(html.encode() + (root / 'manifest.webmanifest').read_bytes() + re.sub(r"const VERSION = '[^']+';", '', worker).encode()).hexdigest()[:12]
worker = re.sub(r"const VERSION = '[^']+';", f"const VERSION = 'zns-{digest}';", worker)
worker_path.write_text(worker)
print('Versioned assets and offline cache:', digest)
