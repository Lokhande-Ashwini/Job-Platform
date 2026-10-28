with open("frontend/src/landing.css", "r", encoding="utf-8") as f:
    code = f.read()

# Fix features-grid - better responsive grid
code = code.replace(
    ".features-grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 2rem;\n  max-width: 1200px;\n  margin: 0 auto;\n}",
    ".features-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\n  gap: 1.75rem;\n  max-width: 1200px;\n  margin: 0 auto;\n}"
)

# Fix services-grid - use auto-fit so all 8 fit properly
code = code.replace(
    ".services-grid {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 1.5rem;\n  max-width: 1200px;\n  margin: 0 auto;\n}",
    ".services-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));\n  gap: 1.25rem;\n  max-width: 1200px;\n  margin: 0 auto;\n}"
)

with open("frontend/src/landing.css", "w", encoding="utf-8") as f:
    f.write(code)

print("landing css fixed")
