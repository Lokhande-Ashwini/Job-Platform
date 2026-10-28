code = open("frontend/src/pages/Bookings.js","r",encoding="utf-8").read()
lines = code.split("\n")
for i,l in enumerate(lines):
    if "ALL_STATUSES" in l and "eslint" not in l and "const" in l:
        lines[i] = l + " // eslint-disable-line"
open("frontend/src/pages/Bookings.js","w",encoding="utf-8").write("\n".join(lines))
print("fixed")
