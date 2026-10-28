import os, re
for root, dirs, files in os.walk("frontend/src"):
    dirs[:] = [d for d in dirs if d != "node_modules"]
    for f in files:
        if not f.endswith(".js"): continue
        path = os.path.join(root, f)
        code = open(path,"r",encoding="utf-8").read()
        lines = code.split("\n")
        changed = False
        for i,l in enumerate(lines):
            # Find lines with duplicate borderLeft
            if l.count("borderLeft:") > 1:
                # Remove the first occurrence of borderLeft:...
                fixed = re.sub(r"borderLeft:[^,}]+,\s*", "", l, count=1)
                lines[i] = fixed
                changed = True
                print(f"Fixed line {i+1} in {f}")
        if changed:
            open(path,"w",encoding="utf-8").write("\n".join(lines))
