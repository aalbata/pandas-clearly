# Accessibility and ways to use the course

Pandas, Clearly is intended for learners with different backgrounds, devices, and ways of accessing information. These notes describe useful learning routes and the standards contributors should check. They are not a certification of conformance with an accessibility standard.

## Choose a format that works for you

The browser classroom presents the lesson, code, questions, and feedback together. Student notebooks provide an alternative way to read and edit the same material. The Markdown guides can be read as ordinary text in GitHub, a text editor, or another Markdown reader.

If an interactive control is difficult to use with your setup, the notebook route lets you work directly with code and written explanations. Please report the specific barrier so the interactive route can be improved as well.

## Reading code and output

Enlarge the page or notebook text to a comfortable size. Read the short explanation before the code, then follow the values, labels, and shape of the output. Wide tables may need horizontal scrolling; a short list of selected columns can make a discussion easier to follow without changing the underlying data.

A plot should be read with its title, labels, and accompanying numeric output. Color alone should not carry a distinction that is necessary to understand an answer. When teaching from a plot, describe the relevant pattern and the values supporting it.

## Keyboard and assistive technology

Use the browser's normal keyboard navigation to reach links, buttons, fields, and disclosure controls. In Jupyter, the notebook interface also has its own edit and command modes; use its keyboard help if a shortcut behaves differently from a normal webpage.

When contributing interface changes, check that a keyboard user can reach and leave every interactive control, identify the current focus, and perform the task without a pointer. Errors and result changes should be described in text and exposed meaningfully to assistive technology. A layout that looks correct in a screenshot still needs interaction checks.

## Language and learning pace

The lessons introduce technical vocabulary alongside examples. Use the [reference guide](reference-guide.md) for reminders and answer explanation questions in your own words. Clear reasoning matters more than reproducing the course's exact phrasing.

Pause after a prediction or a changed requirement. Revisiting an earlier module is a normal part of learning. If you already know the Python basics, the [course map](course-map.md) provides a shorter route into pandas-specific ideas.

## Connections and local access

The browser runtime is bundled with the site. Loading the public site needs a connection to that site; a complete downloaded repository can instead be served locally for offline study. Native Jupyter notebooks can also run locally after their dependencies have been installed. Keep the full course and data folders together.

The first Python initialization can take longer than reading a lesson. Runtime status should distinguish loading from a code error. If loading fails, record the message and the route you used, such as the published website or a local server.

## Report a barrier

Use the repository's accessibility issue template. Include the page or cell ID, what you were trying to do, what blocked you, and any relevant browser, device, or assistive-tool information you are comfortable sharing. You do not need to disclose a disability or provide a technical fix.

## Contributor review checklist

- Clear headings and meaningful link and control names.
- Keyboard operation, visible focus, and a logical reading order.
- Readable contrast, scalable text, and layouts that work at narrow widths.
- Text explanations for state, correctness, errors, and information shown in plots.
- Tables with meaningful headers and units.
- Code and output that remain selectable and readable.
- Equivalent access to the lesson's essential content through written material and notebooks.
- No unnecessary time limit for reading, predicting, or entering an answer.

These checks should guide review rather than become an unverified claim about every browser and assistive-tool combination. The [W3C accessibility introduction](https://www.w3.org/WAI/fundamentals/accessibility-intro/) and [WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/) provide the broader standards context.

---

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates  
[GitHub: aalbata](https://github.com/aalbata) · [pandas-clearly](https://github.com/aalbata/pandas-clearly)
