code = open("frontend/src/pages/Messages.js","r",encoding="utf-8").read()
# Find S.page style
idx = code.find("minHeight: '100vh'")
print("found:", idx)
if idx > 0:
    print(repr(code[idx:idx+100]))
