results = []

# Dashboard.js
d = open("frontend/src/pages/Dashboard.js","r",encoding="utf-8").read()
results.append(("Dashboard sidebar fixed", "position:'fixed'" in d))
results.append(("Dashboard main marginLeft", "marginLeft:sidebarOpen" in d))
results.append(("Dashboard outer height:100vh", "height:'100vh'" in d))
results.append(("Dashboard topbar sticky", "position:'sticky'" in d))

# AdminDashboard.js
a = open("frontend/src/pages/AdminDashboard.js","r",encoding="utf-8").read()
results.append(("Admin sidebar fixed", "position:'fixed'" in a))
results.append(("Admin main marginLeft", "marginLeft:sidebarOpen" in a))
results.append(("Admin outer height:100vh", "height:'100vh'" in a))
results.append(("Admin topbar sticky", "position:'sticky'" in a))

# Navbar.js
n = open("frontend/src/components/Navbar.js","r",encoding="utf-8").read()
results.append(("Navbar sticky", "position: 'sticky'" in n))

for name, ok in results:
    print(("OK" if ok else "MISSING"), name)
