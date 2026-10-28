import os

files_to_check = [
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
    "frontend/src/pages/AdminFinance.js",
    "frontend/src/pages/Landing.js",
    "frontend/src/pages/Login.js",
    "frontend/src/pages/Register.js",
    "frontend/src/pages/Notifications.js",
    "frontend/src/pages/WorkerRequests.js",
    "frontend/src/components/Navbar.js",
    "frontend/src/App.js",
    "backend/server.js",
    "backend/controllers/adminController.js",
    "backend/controllers/bookingController.js",
    "backend/controllers/workerController.js",
    "backend/middleware/auth.js",
]

all_ok = True
for f in files_to_check:
    if not os.path.exists(f):
        print(f"MISSING: {f}")
        all_ok = False
        continue
    code = open(f,"r",encoding="utf-8").read()
    if "export default" not in code and f.endswith(".js") and "frontend/src" in f and "App.js" not in f and "middleware" not in f and "controllers" not in f and "server.js" not in f:
        print(f"NO EXPORT: {f}")
        all_ok = False

if all_ok:
    print("ALL FILES OK")
