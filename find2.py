import os
for root, dirs, files in os.walk("frontend/src"):
    dirs[:] = [d for d in dirs if d != "node_modules"]
    for f in files:
        if not f.endswith(".js"): continue
        path = os.path.join(root, f)
        code = open(path,"r",encoding="utf-8").read()
        lines = code.split("\n")
        for i,l in enumerate(lines):
            if i == 270 and "useEffect" in l:
                print(path, i+1, l[:80])
