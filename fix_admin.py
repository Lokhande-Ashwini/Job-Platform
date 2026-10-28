with open("frontend/src/pages/AdminDashboard.js", "r", encoding="utf-8") as f:
    code = f.read()

# Fix admin sidebar - already has position:sticky, change to fixed
code = code.replace(
    "position:'sticky', top:0, height:'100vh'",
    "position:'fixed', top:0, left:0, height:'100vh', zIndex:100"
)
code = code.replace(
    "position:'sticky',top:0,height:'100vh'",
    "position:'fixed',top:0,left:0,height:'100vh',zIndex:100"
)

# Fix admin outer wrapper
code = code.replace(
    "display:'flex', minHeight:'100vh', background:'#f8fafc'",
    "display:'flex', height:'100vh', overflow:'hidden', background:'#f8fafc'"
)
code = code.replace(
    "display:'flex',minHeight:'100vh',background:'#f8fafc'",
    "display:'flex',height:'100vh',overflow:'hidden',background:'#f8fafc'"
)

# Fix admin main content margin
code = code.replace(
    "<main style={{flex:1, overflow:'auto'}}>",
    "<main style={{flex:1, overflow:'auto', marginLeft:sidebarOpen?240:64, transition:'margin-left 0.3s'}}>"
)
code = code.replace(
    "<main style={{flex:1,overflow:'auto'}}>",
    "<main style={{flex:1,overflow:'auto',marginLeft:sidebarOpen?240:64,transition:'margin-left 0.3s'}}>"
)

with open("frontend/src/pages/AdminDashboard.js", "w", encoding="utf-8") as f:
    f.write(code)

print("admin fixed")
