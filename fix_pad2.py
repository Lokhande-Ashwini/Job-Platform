for path in ["frontend/src/pages/Profile.js", "frontend/src/pages/WorkerRequests.js"]:
    code = open(path,"r",encoding="utf-8").read()
    code = code.replace("paddingTop:'80px'", "paddingTop:0")
    open(path,"w",encoding="utf-8").write(code)
    print("Fixed:", path.split("/")[-1])
