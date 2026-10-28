import os
for root, dirs, files in os.walk("frontend/src"):
    dirs[:] = [d for d in dirs if d != "node_modules"]
    for f in files:
        if not f.endswith(".js"): continue
        path = os.path.join(root, f)
        code = open(path,"r",encoding="utf-8").read()
        lines = code.split("\n")
        if len(lines) > 582:
            l = lines[582]
            if "borderLeft" in l and l.count("borderLeft") > 1:
                print(f, 583, repr(l[:150]))
