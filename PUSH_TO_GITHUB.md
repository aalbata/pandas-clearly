# Push the course to GitHub

These steps publish the supplied repository as **aalbata/pandas-clearly** and serve the generated website from the `main` branch's `docs/` folder. Run them when you are ready to publish your copy.

## 1. Create an empty repository

Sign in to GitHub as **aalbata** and create a repository named **pandas-clearly**. Choose **Public** for the public course. Leave the initial README, `.gitignore`, and license options unselected because these files are already included in the local folder.

Keep the repository URL from GitHub's setup page. For this account and name, the HTTPS remote is:

```text
https://github.com/aalbata/pandas-clearly.git
```

## 2. Open the extracted folder

Install Git if needed. In Windows File Explorer, open the extracted `pandas-clearly` folder, right-click the background, and open a terminal there. Check that this is the folder containing `README.md`, `content/`, `docs/`, and `scripts/`.

```powershell
git --version
Get-Location
Get-ChildItem
```

The ready-to-publish static files are included in `docs/`. If you have changed the course source, rebuild and validate before committing. After creating the local Python environment described in `START_HERE.md`, run:

```powershell
.\.venv\Scripts\python.exe scripts/validate.py --write-outputs
.\.venv\Scripts\python.exe scripts/build.py
.\.venv\Scripts\python.exe -m http.server 8000 --directory docs
```

Preview [http://localhost:8000/](http://localhost:8000/). Press **Ctrl+C** in the server terminal when finished. The `docs/index.html` file must be present before enabling Pages.

## 3. Create the first commit

For a fresh extracted folder that does not already contain a Git repository:

```powershell
git init -b main
git add .
git status
git commit -m "Release Pandas, Clearly v1.0.0"
```

If Git asks for your name and email, set the identity you use for your GitHub commits, then repeat the commit. You can use the GitHub-provided private commit email shown in your GitHub email settings. Example commands use placeholders that you should replace:

```powershell
git config user.name "Ali Al Bataineh"
git config user.email "YOUR_GITHUB_COMMIT_EMAIL"
```

If your folder is already a Git repository, inspect `git status` and `git branch --show-current` first, then commit your intended changes in the existing history. Do not replace an existing repository's history to follow the fresh-folder example.

## 4. Add the remote and push

For a fresh repository with no `origin` remote:

```powershell
git remote add origin https://github.com/aalbata/pandas-clearly.git
git remote -v
git push -u origin main
```

Complete GitHub authentication if prompted. Git for Windows commonly opens an authentication flow through Git Credential Manager. GitHub account passwords are not used as passwords for HTTPS Git operations; see GitHub's [authentication guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github).

If `origin` already exists, inspect it with `git remote -v`. Use the verified existing remote or deliberately update it; do not add a second origin or force-push to work around an unexpected error. If the remote repository already has commits, reconcile them before pushing.

## 5. Enable the course website

In the GitHub repository:

1. Open **Settings** and then **Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch **main** and folder **/docs**.
4. Save, then check the Pages status or the repository's Actions tab for the deployment result.

Once GitHub reports a successful publication, the expected address is:

[https://aalbata.github.io/pandas-clearly/](https://aalbata.github.io/pandas-clearly/)

The website uses the static files already generated in `docs/`. Keep `docs/.nojekyll` in the committed output so those files are served as prepared. A validation workflow is separate from the Pages publishing-source setting.

## 6. Publish later changes

Edit lesson source in `content/modules/`, run validation and the build, and preview the result. Then commit both the source changes and their regenerated site/notebook outputs:

```powershell
git status
git add .
git diff --cached --stat
git commit -m "Improve lesson explanations and regenerate course"
git push
```

The branch-based Pages configuration publishes changes in the committed `docs/` folder. Editing a local source file alone does not update the website.

## Common issues

| Message or symptom | What to check |
| --- | --- |
| `remote origin already exists` | Inspect `git remote -v`; the remote may already be configured correctly. |
| `src refspec main does not match any` | Confirm that a commit exists and the current branch is named `main`. |
| Push rejected because the remote has work | Inspect the remote commits and reconcile them; avoid force-pushing over unknown work. |
| Pages returns 404 | Confirm deployment succeeded and the source is `main` / `docs`, with `docs/index.html` committed. |
| Pages shows an older lesson | Rebuild, commit the updated `docs/` output, push, and check the deployment status. |
| Python cells do not load | Confirm the page is served correctly and the browser can load the runtime packages. Check the classroom runtime status. |

## Official instructions

The Git initialization and push sequence follows GitHub's [adding locally hosted code guide](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github). Publishing from a branch and `/docs` follows GitHub's [Pages publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). GitHub may update menu labels; its documentation is the reference when the interface changes.

---

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates  
[GitHub: aalbata](https://github.com/aalbata) · [pandas-clearly](https://github.com/aalbata/pandas-clearly)
