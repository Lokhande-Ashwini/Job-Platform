import os, glob

pages = glob.glob("frontend/src/pages/*.js")
fixed = 0
for path in pages:
    code = open(path, "r", encoding="utf-8").read()
    if "paddingTop:'64px'" in code:
        code = code.replace("paddingTop:'64px'", "paddingTop:'80px'")
        open(path, "w", encoding="utf-8").write(code)
        fixed += 1
        print("Fixed:", path)
print("Total:", fixed)
