"""Validate every notebook and execute representative complete workflows."""
from __future__ import annotations
import json
import os
from pathlib import Path
import shutil
import tempfile
import time
import nbformat
from nbclient import NotebookClient

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault("MPLCONFIGDIR", str(Path(tempfile.gettempdir())/"pandas-clearly-mpl"))


def main():
    paths = sorted((ROOT/"notebooks").rglob("*.ipynb"))
    for path in paths:
        nbformat.validate(nbformat.read(path,as_version=4))
    targets = [
        Path("notebooks/Pandas_Clearly_Solutions.ipynb"),
        Path("notebooks/Independent_Assessment_Solutions.ipynb"),
        next((ROOT/"notebooks/student").glob("01-*.ipynb")).relative_to(ROOT),
        next((ROOT/"notebooks/solutions").glob("28-*.ipynb")).relative_to(ROOT),
    ]
    results=[]
    with tempfile.TemporaryDirectory(prefix="pandas-clearly-notebooks-") as temporary:
        work=Path(temporary)
        shutil.copytree(ROOT/"data",work/"data")
        shutil.copy2(ROOT/"course_setup.py",work/"course_setup.py")
        for relative in targets:
            destination=work/relative
            destination.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/relative,destination)
            notebook=nbformat.read(destination,as_version=4)
            start=time.monotonic()
            client=NotebookClient(notebook,timeout=90,kernel_name="python3",resources={"metadata":{"path":str(destination.parent)}})
            client.execute()
            errors=[output for cell in notebook.cells if cell.cell_type=="code" for output in cell.outputs if output.output_type=="error"]
            assert not errors
            result={"notebook":relative.as_posix(),"code_cells_executed":sum(cell.cell_type=="code" for cell in notebook.cells),"errors":0,"seconds":round(time.monotonic()-start,2)}
            results.append(result)
            print(json.dumps(result),flush=True)
    report={"notebooks_schema_valid":len(paths),"sequential_execution":results,"passed":True}
    (ROOT/"validation/notebooks.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"schema_valid":len(paths),"executed_notebooks":len(results),"passed":True}))


if __name__=="__main__": main()
