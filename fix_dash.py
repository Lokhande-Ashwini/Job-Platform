import re

with open("frontend/src/pages/Dashboard.js", "r", encoding="utf-8") as f:
    code = f.read()

# Fix 1: outer wrapper height:100vh overflow:hidden so fixed sidebar works
code = code.replace(
    "display:'flex',height:'100vh',overflow:'hidden'",
    "display:'flex',height:'100vh',overflow:'hidden'"
)
# Replace minHeight:100vh with height:100vh + overflow:hidden on outer div
code = code.replace(
    "display:'flex',minHeight:'100vh',background:'#f8fafc'",
    "display:'flex',height:'100vh',overflow:'hidden',background:'#f8fafc'"
)

# Fix 2: sidebar position fixed
code = code.replace(
    "position:'sticky',top:0,height:'100vh',overflowY:'auto',overflowX:'hidden'",
    "position:'fixed',top:0,left:0,height:'100vh',overflowY:'auto',overflowX:'hidden',zIndex:100"
)

with open("frontend/src/pages/Dashboard.js", "w", encoding="utf-8") as f:
    f.write(code)

print("fixed")
