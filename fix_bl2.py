code = open("frontend/src/pages/CustomerFinance.js","r",encoding="utf-8").read()
lines = code.split("\n")
# Replace the broken line 295 with correct version
lines[294] = "  <div style={{ background:'white', borderRadius:14, padding:'1.1rem 1.25rem', boxShadow: highlight ? `0 4px 20px ${color}30` : '0 2px 10px rgba(0,0,0,0.05)', border: highlight ? `2px solid ${color}` : '1px solid #f3f4f6', borderLeft:`4px solid ${color}` }}>"
open("frontend/src/pages/CustomerFinance.js","w",encoding="utf-8").write("\n".join(lines))
print("Fixed!")
