code = open("frontend/src/pages/Messages.js","r",encoding="utf-8").read()
# Add paddingTop to the page style
code = code.replace(
    "minHeight: '100vh',\n      background: '#f1f5f9',\n      display: 'flex',\n      flexDirection: 'column",
    "minHeight: '100vh',\n      background: '#f1f5f9',\n      display: 'flex',\n      flexDirection: 'column',\n      paddingTop: '80px'"
)
open("frontend/src/pages/Messages.js","w",encoding="utf-8").write(code)
print("fixed:", "paddingTop: '80px'" in code)
