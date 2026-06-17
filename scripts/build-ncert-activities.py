import json
import re
from pathlib import Path

import pdfplumber


WORKSPACE = Path(__file__).resolve().parents[1]
PDF_FILES = [
    r"C:\Users\meera\OneDrive - Vision Empower\COE\Science\Lab work NCERT.pdf",
    r"C:\Users\meera\OneDrive - Vision Empower\COE\Science\Lab work NCERT 2.pdf",
]


def clean(text):
    text = re.sub(
        r"(Laboratory Manual\s*[-–]\s*Elementary Stage|Mathematics)\s*\d+\s*Lab manual Activity \d+ to \d+\.indd\s+\d+\s+\d{2}-[A-Za-z]{3}-\d{2}\s+[\d:]+\s+[AP]M",
        " ",
        text,
    )
    replacements = {
        "Ц": "-",
        "╫": "x",
        "â€“": "-",
        "â€”": "-",
        "â€˜": "'",
        "â€™": "'",
    }
    for source, replacement in replacements.items():
        text = text.replace(source, replacement)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" -")


def section(block, start_patterns, end_patterns):
    start = None
    for pattern in start_patterns:
      match = re.search(pattern, block, flags=re.I | re.S)
      if match:
          start = match.end()
          break
    if start is None:
        return ""
    end = len(block)
    for pattern in end_patterns:
        match = re.search(pattern, block[start:], flags=re.I | re.S)
        if match:
            end = min(end, start + match.start())
    return clean(block[start:end])


def resource_queries(title):
    lower = title.lower()
    queries = ["Tactile Mathematics Primer"]
    if any(word in lower for word in ["tangram", "shape", "cube", "cuboid", "2-d", "3-d", "net"]):
        queries.append("Encyclopedia of Geometry")
    if any(word in lower for word in ["data", "display", "interpret", "length", "graph"]):
        queries.append("DIY Kit for graphs")
    if any(word in lower for word in ["operation", "addition", "subtraction", "multiplication", "division", "grouping"]):
        queries.append("Tactile Activity Book")
    return queries


def concepts(title):
    lower = title.lower()
    items = ["TIK: mathematics"]
    if "add" in lower or "sum" in lower:
        items.append("addition")
    if "subtract" in lower:
        items.append("subtraction")
    if "multiplication" in lower or "multiples" in lower:
        items.append("multiplication")
    if "division" in lower or "factors" in lower:
        items.append("division and factors")
    if any(word in lower for word in ["shape", "tangram", "cube", "cuboid", "2-d", "3-d", "net"]):
        items.append("geometry")
    if "data" in lower or "length" in lower:
        items.append("data handling")
    if "magic square" in lower or "pattern" in lower or "pyramid" in lower:
        items.append("patterns")
    if "estimate" in lower:
        items.append("estimation")
    if "even" in lower or "odd" in lower:
        items.append("even and odd")
    return ", ".join(dict.fromkeys(items))


ACTIVITY_OVERRIDES = {
    26: {
        "name": "NCERT Activity 26: Number Puzzle",
        "objective": "Complete a number puzzle by placing the listed numbers correctly in the grid.",
        "otherResources": "Number puzzle grid and number cards from the NCERT manual.",
        "steps": "Provide the puzzle grid and list of numbers. Learners scan the grid, compare the number of boxes with the digit count of each number, place matching numbers, and use intersections to check each digit.",
        "observations": "Numbers fit only when the digit count and crossing digits match the grid.",
        "inferences": "Systematic comparison, place value, and pattern checking help solve number puzzles.",
        "concepts": "TIK: mathematics, place value, patterns, logical reasoning",
        "resourceQueries": ["Tactile Mathematics Primer", "Tactile Activity Book"],
    },
    27: {
        "name": "NCERT Activity 27: Cross Number Game",
        "objective": "Solve a cross-number game by calculating across and down clues and filling the number boxes.",
        "otherResources": "Cross-number grid and arithmetic clue list from the NCERT manual.",
        "steps": "Give learners the tactile cross-number grid. Read or provide the across and down arithmetic clues. Learners solve each clue, fill the answer in the matching boxes, and check that intersecting digits agree.",
        "observations": "Correct answers satisfy both the arithmetic clue and the crossing entries in the grid.",
        "inferences": "A cross-number game strengthens addition, subtraction, multiplication, and checking strategies.",
        "concepts": "TIK: mathematics, arithmetic operations, logical reasoning, patterns",
        "resourceQueries": ["Tactile Mathematics Primer", "Tactile Activity Book"],
    },
}


def extract_activities():
    text_parts = []
    for pdf_file in PDF_FILES:
        with pdfplumber.open(pdf_file) as pdf:
            text_parts.extend(page.extract_text() or "" for page in pdf.pages)
    text = "\n".join(text_parts)
    starts = list(re.finditer(r"(?m)^\s*(\d+)\s*\nActivity\b", text))
    activities = []
    for index, match in enumerate(starts):
        number = int(match.group(1))
        end = starts[index + 1].start() if index + 1 < len(starts) else len(text)
        block = text[match.start():end]
        title = section(block, [r"O\s*bjective"], [r"M\s*[a-z]?\s*aterials?\s*[a-z]?\s*equired", r"d\s*eMOnstratiOn", r"M\s*c\s*ethOd", r"l\s*[a-z]?\s*p\s*et\s*s\s*lay", r"d\s*escriptiOn"])
        if not title:
            title = f"NCERT mathematics activity {number}"
        materials = section(block, [r"M\s*[a-z]?\s*aterials?\s*[a-z]?\s*equired"], [r"M\s*c\s*ethOd", r"d\s*eMOnstratiOn", r"l\s*[a-z]?\s*p\s*et\s*s\s*lay", r"O\s*bservatiOn"])
        steps = section(block, [r"M\s*c\s*ethOd\s*Of\s*OnstructiOn", r"d\s*eMOnstratiOn", r"l\s*[a-z]?\s*p\s*et\s*s\s*lay", r"d\s*escription"], [r"O\s*bservatiOn", r"a\s*pplicatiOn"])
        observation = section(block, [r"O\s*bservatiOn"], [r"a\s*pplicatiOn"])
        application = section(block, [r"a\s*pplicatiOn"], [r"Laboratory Manual", r"Mathematics"])
        activity = {
            "id": f"ncert-math-{number:02d}",
            "source": "NCERT Laboratory Manual - Elementary Stage",
            "activityNumber": number,
            "subject": "Maths",
            "name": f"NCERT Activity {number}: {title}",
            "objective": title,
            "otherResources": materials or "Teacher-prepared tactile materials as described in the NCERT activity.",
            "steps": steps or "Conduct the NCERT activity through tactile construction, guided demonstration, and learner practice.",
            "observations": observation or "Learners record their observations in the activity table or through oral/tactile responses.",
            "inferences": application or f"This activity helps learners understand and apply: {title.lower()}.",
            "concepts": concepts(title),
            "resourceQueries": resource_queries(title),
        }
        activity.update(ACTIVITY_OVERRIDES.get(number, {}))
        activities.append(activity)
    return activities


activities = extract_activities()
target = WORKSPACE / "data" / "ncert-activities.js"
target.write_text("window.NCERT_ACTIVITIES = " + json.dumps(activities, indent=2, ensure_ascii=False) + ";\n", encoding="utf-8")
print(json.dumps({"activities": len(activities), "target": str(target)}, indent=2))
