code = open("frontend/src/pages/Dashboard.js","r",encoding="utf-8").read()
# Remove bad React import added with double quotes
code = code.replace('import React,{useEffect,useState,useCallback,useMemo}from "react";\n', "")
# Fix single-quote import to add React
code = code.replace(
    "import{useEffect,useState,useCallback}from 'react';",
    "import React,{useEffect,useState,useCallback}from 'react';"
)
# Revert broken memo
code = code.replace("const KpiCard=React.memo(({icon,label,value,sub,color})=>(", "const KpiCard=({icon,label,value,sub,color})=>(")
code = code.replace("}</div></div>));", "}</div></div>);")
open("frontend/src/pages/Dashboard.js","w",encoding="utf-8").write(code)
print("fixed")
