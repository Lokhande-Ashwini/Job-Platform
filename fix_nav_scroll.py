# Fix navbar scrollbar - hide it but keep scrollable
css = open("frontend/src/App.css","r",encoding="utf-8").read()

# Add scrollbar hide for desktop-nav
if "desktop-nav::-webkit-scrollbar" not in css:
    css += """
/* Hide navbar scrollbar but keep scrollable */
.desktop-nav { scrollbar-width: none; -ms-overflow-style: none; }
.desktop-nav::-webkit-scrollbar { display: none; }
"""
    open("frontend/src/App.css","w",encoding="utf-8").write(css)
    print("navbar scrollbar hidden")
else:
    print("already done")
