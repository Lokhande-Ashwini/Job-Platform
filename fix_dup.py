code = open("frontend/src/pages/CustomerFinance.js","r",encoding="utf-8").read()
lines = code.split("\n")
l = lines[582]
# Remove the first borderLeft occurrence, keep the second
import re
# Pattern: borderLeft:..., border:..., borderLeft:...
# Fix: remove first borderLeft
fixed = re.sub(
    r"borderLeft:`4px solid \$\{sc\.color\}`, (border:`1px solid #f3f4f6`, borderLeft:`4px solid \$\{sc\.color\}`)",
    r"\1",
    l
)
lines[582] = fixed
open("frontend/src/pages/CustomerFinance.js","w",encoding="utf-8").write("\n".join(lines))
print("fixed:", "borderLeft" in lines[582])
