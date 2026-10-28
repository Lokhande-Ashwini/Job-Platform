# Fix Navbar polling - 30s is good, keep it
# Fix Dashboard - add React.memo to KpiCard to prevent re-renders
code = open("frontend/src/pages/Dashboard.js","r",encoding="utf-8").read()

# Wrap KpiCard with React.memo
if "React.memo" not in code:
    code = code.replace(
        "const KpiCard=({icon,label,value,sub,color})=>(",
        "const KpiCard=React.memo(({icon,label,value,sub,color})=>("
    )
    # Find the closing of KpiCard and add extra )
    # KpiCard ends with </div></div>);
    code = code.replace(
        "}</div></div>);\nconst Spinner",
        "}</div></div>));\nconst Spinner"
    )

open("frontend/src/pages/Dashboard.js","w",encoding="utf-8").write(code)
print("KpiCard memo:", "React.memo" in code)
