import re

for path in ["frontend/src/pages/Profile.js", "frontend/src/pages/WorkerRequests.js"]:
    code = open(path,"r",encoding="utf-8").read()
    # Find all paddingTop occurrences
    for m in re.finditer(r"paddingTop[^,}]+", code):
        print(path.split("/")[-1], repr(m.group()[:60]))
