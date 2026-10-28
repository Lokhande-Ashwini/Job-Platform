import os, re
for root, dirs, files in os.walk("frontend/src"):
    dirs[:] = [d for d in dirs if d != "node_modules"]
    for f in files:
        if not f.endswith(".js"): continue
        path = os.path.join(root, f)
        code = open(path,"r",encoding="utf-8").read()
        # Find any paddingTop that looks like it compensates for navbar
        for m in re.finditer(r"paddingTop[:\s]+['\"]?(6[0-9]|7[0-9]|8[0-9])px", code):
            print(f.ljust(30), repr(m.group()))
