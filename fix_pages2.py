import os

# Fix pages with different outer div patterns
pages_patterns = {
    "frontend/src/pages/Messages.js": [
        ("minHeight: '100vh', background: '#f1f5f9'", "minHeight: '100vh', background: '#f1f5f9', paddingTop: '64px'"),
        ("minHeight:'100vh',background:'#f1f5f9'", "minHeight:'100vh',background:'#f1f5f9',paddingTop:'64px'"),
    ],
    "frontend/src/pages/Profile.js": [
        ("className=\"dashboard\"", "className=\"dashboard\" style={{paddingTop:'64px'}}"),
    ],
    "frontend/src/pages/WorkerRequests.js": [
        ("className=\"dashboard\"", "className=\"dashboard\" style={{paddingTop:'64px'}}"),
    ],
}

for path, patterns in pages_patterns.items():
    if not os.path.exists(path):
        continue
    code = open(path, "r", encoding="utf-8").read()
    changed = False
    for old, new in patterns:
        if old in code and new not in code:
            code = code.replace(old, new, 1)
            changed = True
    if changed:
        open(path, "w", encoding="utf-8").write(code)
        print("Fixed:", path)
