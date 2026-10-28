code = open("frontend/src/pages/Dashboard.js", "r", encoding="utf-8").read()

# Main content - remove minHeight:100vh from main, just let it flow naturally
code = code.replace(
    "flex:1,overflow:'auto',display:'flex',flexDirection:'column',marginLeft:sidebarOpen?240:64,transition:'margin-left 0.3s',minHeight:'100vh'",
    "flex:1,display:'flex',flexDirection:'column',marginLeft:sidebarOpen?240:64,transition:'margin-left 0.3s',minHeight:'100vh'"
)

open("frontend/src/pages/Dashboard.js", "w", encoding="utf-8").write(code)
print("main fixed:", code.count("marginLeft:sidebarOpen"))
