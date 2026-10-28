import os
for root, dirs, files in os.walk("frontend/src"):
    dirs[:] = [d for d in dirs if d != "node_modules"]
    for f in files:
        if not f.endswith(".js"): continue
        path = os.path.join(root, f)
        code = open(path,"r",encoding="utf-8").read()
        has_decl = "navigate = useNavigate" in code
        has_use = "navigate(" in code
        has_disable = "eslint-disable" in code
        if has_decl and not has_use and not has_disable:
            print("UNUSED:", path)
