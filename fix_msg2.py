code = open("frontend/src/pages/Messages.js","r",encoding="utf-8").read()
code = code.replace("paddingTop: '80px'',", "paddingTop: '80px',")
open("frontend/src/pages/Messages.js","w",encoding="utf-8").write(code)
print("fixed")
