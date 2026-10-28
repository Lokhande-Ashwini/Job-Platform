code = open("frontend/src/pages/Dashboard.js", "r", encoding="utf-8").read()
code = code.replace(
    "display:'flex',height:'100vh',overflow:'hidden',background:'#f8fafc',fontFamily:'Inter,system-ui,sans-serif'",
    "display:'flex',minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,system-ui,sans-serif'"
)
open("frontend/src/pages/Dashboard.js", "w", encoding="utf-8").write(code)
print("fixed:", code.count("minHeight:'100vh'"))
