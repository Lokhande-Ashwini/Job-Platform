code = open("frontend/src/landing.css","r",encoding="utf-8").read()

# Fix section-title typography
if "letter-spacing: -0.5px" not in code:
    code = code.replace(
        ".section-title {\n  font-size: 2.5rem;\n  font-weight: 700;\n  text-align: center;\n  color: #1f2937;\n  margin-bottom: 1rem;\n}",
        ".section-title {\n  font-size: 2rem;\n  font-weight: 800;\n  text-align: center;\n  color: #1f2937;\n  margin-bottom: 0.75rem;\n  letter-spacing: -0.5px;\n}"
    )

# Fix section-subtitle
if "max-width: 560px" not in code:
    code = code.replace(
        ".section-subtitle {\n  text-align: center;\n  color: #6b7280;\n  font-size: 1.1rem;\n  margin-bottom: 3rem;\n}",
        ".section-subtitle {\n  text-align: center;\n  color: #6b7280;\n  font-size: 1rem;\n  margin-bottom: 2.5rem;\n  max-width: 560px;\n  margin-left: auto;\n  margin-right: auto;\n}"
    )

# Fix features-grid responsive
code = code.replace(
    "grid-template-columns: repeat(3, 1fr);",
    "grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));"
)

# Fix feature-card - cleaner look
code = code.replace(
    ".feature-card {\n  background: #f9fafb;\n  padding: 2rem;\n  border-radius: 16px;\n  text-align: center;\n  transition: all 0.3s;\n  border: 2px solid transparent;\n}",
    ".feature-card {\n  background: white;\n  padding: 1.75rem 1.5rem;\n  border-radius: 16px;\n  text-align: center;\n  transition: all 0.25s;\n  border: 1.5px solid #e5e7eb;\n  box-shadow: 0 1px 6px rgba(0,0,0,0.05);\n}"
)

# Fix services-grid - all 8 items fit properly
code = code.replace(
    "grid-template-columns: repeat(4, 1fr);",
    "grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));"
)

# Fix features-section background
code = code.replace(
    ".features-section {\n  padding: 5rem 5%;\n  background: white;\n}",
    ".features-section {\n  padding: 5rem 5%;\n  background: #f8fafc;\n}"
)

open("frontend/src/landing.css","w",encoding="utf-8").write(code)
print("landing.css done")
