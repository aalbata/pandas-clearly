"""Check local page links, signatures, notebook structure, and source identity."""
from __future__ import annotations
import ast
from html.parser import HTMLParser
import json
from pathlib import Path
import urllib.parse

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "docs"
SIGNATURE = "Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates"


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.links = []
        self.images = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"): self.ids.append(attrs["id"])
        if tag == "a" and attrs.get("href"): self.links.append(attrs["href"])
        if tag in {"img", "script", "link"}:
            url = attrs.get("src") or attrs.get("href")
            if url: self.links.append(url)
        if tag == "img": self.images.append(attrs)


def main():
    failures = []
    parsers = {}
    for path in SITE.rglob("*.html"):
        content = path.read_text(encoding="utf-8")
        parser = PageParser(); parser.feed(content); parsers[path.resolve()] = parser
        if SIGNATURE not in content or "Dr. Ali Al Bataineh" not in content:
            failures.append(f"Missing author affiliation: {path.relative_to(ROOT)}")
        if len(parser.ids) != len(set(parser.ids)):
            failures.append(f"Duplicate HTML IDs: {path.relative_to(ROOT)}")
        for image in parser.images:
            if not image.get("alt"): failures.append(f"Image without alternative text: {path.relative_to(ROOT)}")
    links_checked = 0
    for path,parser in parsers.items():
        for url in parser.links:
            parts = urllib.parse.urlsplit(url)
            if parts.scheme or parts.netloc: continue
            target = (path.parent/urllib.parse.unquote(parts.path)).resolve() if parts.path else path
            if target.is_dir(): target = target/"index.html"
            links_checked += 1
            if not target.is_file():
                failures.append(f"Broken local link: {path.relative_to(ROOT)} -> {url}")
            elif parts.fragment and target in parsers and urllib.parse.unquote(parts.fragment) not in parsers[target].ids:
                failures.append(f"Missing anchor: {path.relative_to(ROOT)} -> {url}")
    notebooks = list((ROOT/"notebooks").rglob("*.ipynb"))
    for path in notebooks:
        nb = json.loads(path.read_text(encoding="utf-8"))
        assert nb["nbformat"] == 4
        cell_ids = [cell["id"] for cell in nb["cells"]]
        if len(cell_ids) != len(set(cell_ids)): failures.append(f"Repeated notebook cell ID: {path.name}")
        if SIGNATURE not in json.dumps(nb,ensure_ascii=False): failures.append(f"Notebook missing affiliation: {path.name}")
        for cell in nb["cells"]:
            source = "".join(cell["source"])
            if cell["cell_type"] == "code":
                try: ast.parse(source)
                except SyntaxError as error: failures.append(f"Notebook syntax error: {path.name}: {error}")
    import yaml
    citation = yaml.safe_load((ROOT/"CITATION.cff").read_text(encoding="utf-8"))
    assert citation["cff-version"] == "1.2.0"
    assert citation["authors"][0]["family-names"] == "Al Bataineh"
    assert "Ras Al Khaimah" in citation["authors"][0]["affiliation"]
    assert "https://github.com/aalbata/pandas-clearly" in json.dumps(citation,default=str)
    report = {"html_pages":len(parsers),"local_links_checked":links_checked,"notebooks_checked":len(notebooks),"citation_metadata":True,"author_affiliation_on_every_html_page":not any("affiliation" in f for f in failures),"failures":failures}
    (ROOT/"validation").mkdir(exist_ok=True)
    (ROOT/"validation/site-structure.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,indent=2))
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__": main()
