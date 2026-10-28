code = open("frontend/src/pages/Landing.js","r",encoding="utf-8").read()

# Add a section header wrapper div for better spacing in features section
code = code.replace(
    '<section id="features" className="features-section">\n        <h2 className="section-title">Why Choose Hyperlocal Jobs?</h2>\n        <p className="section-subtitle">Everything you need to find and hire local professionals</p>',
    '<section id="features" className="features-section">\n        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>\n          <span style={{background:"#ede9fe",color:"#6366f1",padding:"0.3rem 1rem",borderRadius:50,fontSize:"0.82rem",fontWeight:700,display:"inline-block",marginBottom:"0.875rem"}}>Why Us</span>\n          <h2 className="section-title">Why Choose Hyperlocal Jobs?</h2>\n          <p className="section-subtitle">Everything you need to find and hire local professionals</p>\n        </div>'
)

# Add section header wrapper for Popular Services
code = code.replace(
    '<section id="services" className="services-section">\n        <h2 className="section-title">Popular Services</h2>\n        <p className="section-subtitle">Find experts for all your needs</p>',
    '<section id="services" className="services-section">\n        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>\n          <span style={{background:"#dbeafe",color:"#1e40af",padding:"0.3rem 1rem",borderRadius:50,fontSize:"0.82rem",fontWeight:700,display:"inline-block",marginBottom:"0.875rem"}}>Services</span>\n          <h2 className="section-title">Popular Services</h2>\n          <p className="section-subtitle">Find experts for all your needs</p>\n        </div>'
)

open("frontend/src/pages/Landing.js","w",encoding="utf-8").write(code)
print("Landing.js fixed")
