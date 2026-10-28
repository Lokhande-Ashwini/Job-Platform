import os, re
for root, dirs, files in os.walk("frontend/src/pages"):
    for f in files:
        if not f.endswith(".js"): continue
        path = os.path.join(root, f)
        code = open(path,"r",encoding="utf-8").read()
        if "paddingTop:'80px'" in code or "paddingTop: '80px'" in code or "paddingTop:80" in code:
            print("HAS paddingTop 80:", f)
        if "paddingTop:'64px'" in code or "paddingTop: '64px'" in code:
            print("HAS paddingTop 64:", f)
