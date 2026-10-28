# Fix Navbar.js - increase polling interval from 10s to 30s to reduce API calls
code = open("frontend/src/components/Navbar.js","r",encoding="utf-8").read()
code = code.replace("setInterval(fetchNotifications, 10000)", "setInterval(fetchNotifications, 30000)")
open("frontend/src/components/Navbar.js","w",encoding="utf-8").write(code)
print("Navbar polling:", "30000" in code)

# Fix Dashboard.js - add React import for potential future use, clean up
code = open("frontend/src/pages/Dashboard.js","r",encoding="utf-8").read()
# Remove useMemo from import if it was added but not used
code = code.replace("import React,{useEffect,useState,useCallback,useMemo}from 'react';", "import React,{useEffect,useState,useCallback}from 'react';")
open("frontend/src/pages/Dashboard.js","w",encoding="utf-8").write(code)
print("Dashboard import:", "import React" in code)
