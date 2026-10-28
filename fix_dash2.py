with open("frontend/src/pages/Dashboard.js", "r", encoding="utf-8") as f:
    code = f.read()

# Fix main content - needs marginLeft to account for fixed sidebar
# Customer dashboard main
code = code.replace(
    "<main style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column'}}>",
    "<main style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column',marginLeft:sidebarOpen?240:64,transition:'margin-left 0.3s',minHeight:'100vh'}}>"
)

# Worker dashboard main (uses sidebarOpen too)
# Already handled above since same pattern

with open("frontend/src/pages/Dashboard.js", "w", encoding="utf-8") as f:
    f.write(code)

print("main fixed:", code.count("marginLeft:sidebarOpen"))
