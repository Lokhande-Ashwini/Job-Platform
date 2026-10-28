code = open("frontend/src/landing.css","r",encoding="utf-8").read()

# Fix features-section padding and alignment
code = code.replace(
    ".features-section {\n  padding: 5rem 5%;\n  background: white;\n}",
    ".features-section {\n  padding: 5rem 5%;\n  background: #f8fafc;\n}"
)

# Fix section-title
old_title = ".section-title {\n  font-size: 2.5rem;\n  font-weight: 700;\n  text-align: center;\n  color: #1f2937;\n  margin-bottom: 1rem;\n}"
new_title = ".section-title {\n  font-size: 2rem;\n  font-weight: 800;\n  text-align: center;\n  color: #1f2937;\n  margin-bottom: 0.75rem;\n  letter-spacing: -0.5px;\n}"
code = code.replace(old_title, new_title)

# Fix section-subtitle
old_sub = ".section-subtitle {\n  text-align: center;\n  color: #6b7280;\n  font-size: 1.1rem;\n  margin-bottom: 3rem;\n}"
new_sub = ".section-subtitle {\n  text-align: center;\n  color: #6b7280;\n  font-size: 1rem;\n  margin-bottom: 2.5rem;\n  max-width: 560px;\n  margin-left: auto;\n  margin-right: auto;\n}"
code = code.replace(old_sub, new_sub)

# Fix features-grid - proper responsive
old_fg = ".features-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\n  gap: 1.75rem;\n  max-width: 1200px;\n  margin: 0 auto;\n}"
new_fg = ".features-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));\n  gap: 1.5rem;\n  max-width: 1200px;\n  margin: 0 auto;\n}"
code = code.replace(old_fg, new_fg)

# Fix feature-card
old_fc = ".feature-card {\n  background: #f9fafb;\n  padding: 2rem;\n  border-radius: 16px;\n  text-align: center;\n  transition: all 0.3s;\n  border: 2px solid transparent;\n}"
new_fc = ".feature-card {\n  background: white;\n  padding: 1.75rem 1.5rem;\n  border-radius: 16px;\n  text-align: center;\n  transition: all 0.25s;\n  border: 1.5px solid #e5e7eb;\n  box-shadow: 0 1px 6px rgba(0,0,0,0.05);\n}"
code = code.replace(old_fc, new_fc)

# Fix services-grid - all 8 items in proper grid
old_sg = ".services-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));\n  gap: 1.25rem;\n  max-width: 1200px;\n  margin: 0 auto;\n}"
new_sg = ".services-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));\n  gap: 1.25rem;\n  max-width: 1100px;\n  margin: 0 auto;\n}"
code = code.replace(old_sg, new_sg)

# Fix services-section background
code = code.replace(
    ".services-section {\n  padding: 5rem 5%;\n  background: #f9fafb;\n}",
    ".services-section {\n  padding: 5rem 5%;\n  background: white;\n}"
)

open("frontend/src/landing.css","w",encoding="utf-8").write(code)
print("landing.css fixed")
