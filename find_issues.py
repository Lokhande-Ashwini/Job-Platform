import os, re

issues = []
for root, dirs, files in os.walk("frontend/src"):
    dirs[:] = [d for d in dirs if d != "node_modules"]
    for f in files:
        if not f.endswith(".js"): continue
        path = os.path.join(root, f)
        code = open(path,"r",encoding="utf-8").read()
        lines = code.split("\n")
        for i,l in enumerate(lines):
            if "exhaustive-deps" in l or ("useEffect" in l and "import" not in l):
                block = "\n".join(lines[i:i+5])
                if "exhaustive-deps" in block and "eslint-disable" not in "\n".join(lines[max(0,i-1):i+6]):
                    issues.append(f"{path}:{i+1}: {l[:80]}")

for x in issues[:10]:
    print(x)
