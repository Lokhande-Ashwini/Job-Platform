import os, re

pages = [
    "frontend/src/pages/Bookings.js",
    "frontend/src/pages/Messages.js",
    "frontend/src/pages/Profile.js",
    "frontend/src/pages/WorkerSearch.js",
    "frontend/src/pages/QuotePage.js",
    "frontend/src/pages/DisputePage.js",
    "frontend/src/pages/SupportTickets.js",
    "frontend/src/pages/WorkerEarnings.js",
    "frontend/src/pages/CustomerFinance.js",
    "frontend/src/pages/AdminFinance.js",
    "frontend/src/pages/Notifications.js",
    "frontend/src/pages/WorkerRequests.js",
]

fixed = 0
for path in pages:
    if not os.path.exists(path):
        continue
    code = open(path, "r", encoding="utf-8").read()
    
    # Pattern: outer div with minHeight:100vh that wraps Navbar
    # Add paddingTop:64 to it
    old = "minHeight:'100vh', background:'#f8fafc'"
    new = "minHeight:'100vh', background:'#f8fafc', paddingTop:'64px'"
    
    if old in code and new not in code:
        code = code.replace(old, new, 1)  # only first occurrence
        open(path, "w", encoding="utf-8").write(code)
        fixed += 1
        print("Fixed:", path)

print(f"Total fixed: {fixed}")
