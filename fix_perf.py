# Fix 1: Navbar.js - polling interval optimization (currently 10s, keep it)
# Fix 2: Dashboard.js - KpiCard and StatusBadge are already pure functions, wrap with memo
code = open("frontend/src/pages/Dashboard.js","r",encoding="utf-8").read()

# Wrap KpiCard with React.memo for performance
code = code.replace(
    "const KpiCard=({icon,label,value,sub,color})=>(",
    "const KpiCard=React.memo(({icon,label,value,sub,color})=>("
)
# Close the memo
code = code.replace(
    "}</div></div>);",
    "}</div></div>));",
    1  # only first occurrence (KpiCard)
)

# Add React import
code = code.replace(
    'import{useEffect,useState,useCallback}from "react";',
    'import React,{useEffect,useState,useCallback,useMemo}from "react";'
)

open("frontend/src/pages/Dashboard.js","w",encoding="utf-8").write(code)
print("Dashboard perf done")
