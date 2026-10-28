import os
for root, dirs, files in os.walk("frontend/src"):
    dirs[:] = [d for d in dirs if d != "node_modules"]
    for f in files:
        if not f.endswith(".js"): continue
        path = os.path.join(root, f)
        code = open(path,"r",encoding="utf-8").read()
        lines = code.split("\n")
        if len(lines) > 0 and "useRef" in lines[0] and "import" in lines[0]:
            # Check if useRef is actually used
            rest = "\n".join(lines[1:])
            if "useRef" not in rest:
                print("UNUSED useRef:", path)
