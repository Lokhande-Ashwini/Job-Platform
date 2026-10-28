import os

pages = [
    "frontend/src/pages/AdminFinance.js",
    "frontend/src/pages/Bookings.js",
    "frontend/src/pages/CustomerFinance.js",
    "frontend/src/pages/DisputePage.js",
    "frontend/src/pages/Notifications.js",
    "frontend/src/pages/Profile.js",
    "frontend/src/pages/QuotePage.js",
    "frontend/src/pages/SupportTickets.js",
    "frontend/src/pages/WorkerEarnings.js",
    "frontend/src/pages/WorkerRequests.js",
    "frontend/src/pages/WorkerSearch.js",
]

for path in pages:
    code = open(path,"r",encoding="utf-8").read()
    # Remove paddingTop from outer wrapper divs
    code = code.replace(", paddingTop:'80px'", "")
    code = code.replace(", paddingTop: '80px'", "")
    code = code.replace(",paddingTop:'80px'", "")
    code = code.replace(", paddingTop:'64px'", "")
    code = code.replace(", paddingTop: '64px'", "")
    code = code.replace(",paddingTop:'64px'", "")
    code = code.replace("paddingTop:'80px', ", "")
    code = code.replace("paddingTop: '80px', ", "")
    code = code.replace("paddingTop:'64px', ", "")
    open(path,"w",encoding="utf-8").write(code)
    print("Fixed:", path.split("/")[-1])
