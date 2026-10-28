code = open("frontend/src/pages/AdminDashboard.js", "r", encoding="utf-8").read()

# Fix outer wrapper - remove overflow:hidden
code = code.replace(
    "display:'flex', height:'100vh', overflow:'hidden', background:'#f8fafc'",
    "display:'flex', minHeight:'100vh', background:'#f8fafc'"
)
code = code.replace(
    "display:'flex',height:'100vh',overflow:'hidden',background:'#f8fafc'",
    "display:'flex',minHeight:'100vh',background:'#f8fafc'"
)

open("frontend/src/pages/AdminDashboard.js", "w", encoding="utf-8").write(code)
print("admin fixed")
