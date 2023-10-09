import { Editor, Notice, MarkdownView, Plugin, EditorRange, livePreviewState } from "obsidian";
import { goAndScrollToLine, headingsForActiveFile } from "./utility";
import { HeadingModal } from "./heading_modal";
import { GotoHeadingSettingTab } from "./settings_tab";
import { DEFAULT_SETTINGS, GotoHeadingSettings } from "./settings";

export default class GotoHeadingPlugin extends Plugin {
	settings: GotoHeadingSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new GotoHeadingSettingTab(this.app, this));

		this.addCommand({
			id: "gotoheading-previous",
			name: "Previous heading",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.goToRelativeHeading(editor, view, -1);
			}
		});
		this.addCommand({
			id: "gotoheading-next",
			name: "Next heading",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.goToRelativeHeading(editor, view, 1);
			}
		});
		this.addCommand({
			id: "gotoheading-switcher",
			name: "Open switcher",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.openHeadingSwitcher(editor, view);
			},
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	protected goToRelativeHeading(editor: Editor, view: MarkdownView, offset: number) {
		if (offset == 0) return;

		const headings = headingsForActiveFile(this.app);
		if(!headings?.length) return;
		
		// Get the index of the nearest heading to the cursor
		const line = editor.getCursor().line;
		const nearestHeadingIndex = headings.findLastIndex(heading => heading.position.start.line <= line);
		if (nearestHeadingIndex < 0) return;

		const nearestHeading = headings[nearestHeadingIndex];
		if(offset == -1 && line > nearestHeading.position.end.line) {
			offset = 0;
		}

		// Compute the new heading index
		let idx = nearestHeadingIndex + offset;
		if(idx < 0 || idx >= headings.length) return;

		// Move the cursor to the new heading
		const heading = headings[idx];
		goAndScrollToLine(editor, heading.position.start.line);
	}

	protected openHeadingSwitcher(editor: Editor, view: MarkdownView) {
		const headings = headingsForActiveFile(this.app);
		if(!headings?.length) return;

		let modal = new HeadingModal(this.app);
		modal.setInstructions([
			{ command: "↑↓", purpose: "to navigate" },
			{ command: "↵", purpose: "to jump to heading" },
			{ command: "esc", purpose: "to dismiss" },
		]);
		modal.setPlaceholder("Go to heading...");

		modal.items = headings.map(heading => ({
			heading: heading.heading,
			level: heading.level,
			line: heading.position.start.line
		}));

		modal.onChoose = (item) => {
			goAndScrollToLine(editor, item.line);
			modal.close();
		};

		// Get the index of the nearest heading to the cursor
		const line = editor.getCursor().line;
		modal.defaultItemIndex = headings.findLastIndex(heading => heading.position.start.line <= line);
		modal.settings = this.settings;

		modal.open();
	}
}