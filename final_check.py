code = open("frontend/src/pages/Dashboard.js","r",encoding="utf-8").read()
print("React import:", "import React" in code)
print("Sidebar fixed:", "position:'fixed'" in code)
print("Main marginLeft:", "marginLeft:sidebarOpen" in code)

code2 = open("frontend/src/pages/Messages.js","r",encoding="utf-8").read()
print("Optimistic update:", "_optimistic" in code2)
print("2s polling:", "2000" in code2)

code3 = open("frontend/src/App.js","r",encoding="utf-8").read()
print("Lazy loading:", "lazy(" in code3)
print("Suspense:", "Suspense" in code3)

code4 = open("backend/server.js","r",encoding="utf-8").read()
print("Compression:", "compression" in code4)

code5 = open("backend/middleware/auth.js","r",encoding="utf-8").read()
print("Token from query:", "req.query.token" in code5)

code6 = open("backend/controllers/workerController.js","r",encoding="utf-8").read()
print("Haversine radius:", "maxKm" in code6)

code7 = open("frontend/src/pages/WorkerSearch.js","r",encoding="utf-8").read()
print("Village priority:", "a.village" in code7)
print("zoom=18:", "zoom=18" in code7)
print("GPS warning:", "too inaccurate" in code7)

code8 = open("frontend/src/pages/AdminDashboard.js","r",encoding="utf-8").read()
print("Admin sidebar fixed:", "position:'fixed'" in code8)
print("Admin marginLeft:", "marginLeft:sidebarOpen" in code8)
print("Export buttons:", "admin/export" in code8)
