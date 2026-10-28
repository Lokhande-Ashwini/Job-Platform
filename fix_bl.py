code = open("frontend/src/pages/CustomerFinance.js","r",encoding="utf-8").read()
lines = code.split("\n")
l = lines[294]
# The line has: borderLeft:`4px solid ${color}`, border: ..., borderLeft:`4px solid ${color}`
# Keep only the last borderLeft, remove the first one
parts = l.split("borderLeft:")
# parts[0] = before first borderLeft
# parts[1] = first borderLeft value + rest
# parts[2] = second borderLeft value + rest
if len(parts) == 3:
    # Reconstruct: remove first borderLeft entry
    # Find where first borderLeft ends (at the comma)
    first_val = parts[1]
    # Remove up to and including the comma after first borderLeft
    comma_idx = first_val.find(",")
    if comma_idx >= 0:
        rest_after_first = first_val[comma_idx+1:].lstrip()
        lines[294] = parts[0] + "borderLeft:" + rest_after_first
        print("Fixed!")
    else:
        print("Could not find comma")
else:
    print("Parts:", len(parts))
open("frontend/src/pages/CustomerFinance.js","w",encoding="utf-8").write("\n".join(lines))
