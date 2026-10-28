import os, re

files = [
    "frontend/src/pages/Dashboard.js",
    "frontend/src/pages/AdminDashboard.js",
    "frontend/src/pages/Bookings.js",
    "frontend/src/pages/Messages.js",
    "frontend/src/pages/Profile.js",
    "frontend/src/pages/WorkerSearch.js",
    "frontend/src/pages/QuotePage.js",
    "frontend/src/pages/DisputePage.js",
    "frontend/src/pages/SupportTickets.js",
    "frontend/src/pages/WorkerEarnings.js",
    "frontend/src/pages/CustomerFinance.js",
    "frontend/src/pages/Landing.js",
    "frontend/src/components/Navbar.js",
]

issues = []
for f in files:
    if not os.path.exists(f):
        issues.append(f"MISSING: {f}")
        continue
    code = open(f,"r",encoding="utf-8").read()
    # Check export default
    if "export default" not in code:
        issues.append(f"NO EXPORT: {f}")
    # Check for obvious syntax issues - unmatched braces (rough check)
    opens = code.count("{")
    closes = code.count("}")
    diff = abs(opens - closes)
    if diff > 20:  # allow some tolerance for JSX
        issues.append(f"BRACE MISMATCH ({diff}): {f}")

if issues:
    for i in issues:
        print("ISSUE:", i)
else:
    print("All files OK")
