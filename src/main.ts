import { Editor, Notice, MarkdownView, Plugin, TAbstractFile } from "obsidian";
import { HeadingModal, HeadingSuggestion, FileSuggestion, Suggestion, SuggestionType } from "./heading_modal";
import { GotoHeadingSettingTab } from "./settings_tab";
import { DEFAULT_SETTINGS, GotoHeadingSettings, FolderSortMethod, FolderSortMethodIdentifiers } from "./settings";
import { fileNameWithoutPathOrExtension, goAndScrollToLine, headingsForActiveFile, headingsForActiveFolder, HeadingFolderChildrenFn } from "./utility";

const FolderSortMethodFn: { [method in FolderSortMethod]: HeadingFolderChildrenFn } = {
	[FolderSortMethod.ByNameAscending]: (children) => children.sort((a, b) => a.name.localeCompare(b.name)),
	[FolderSortMethod.ByNameDescending]: (children) => children.sort((a, b) => b.name.localeCompare(a.name)),
	[FolderSortMethod.ByModificationDateDescending]: (children) => children.sort((a, b) => b.stat.mtime - a.stat.mtime),
	[FolderSortMethod.ByModificationDateAscending]: (children) => children.sort((a, b) => a.stat.mtime - b.stat.mtime),
	[FolderSortMethod.ByCreationDateDescending]: (children) => children.sort((a, b) => b.stat.ctime - a.stat.ctime),
	[FolderSortMethod.ByCreationDateAscending]: (children) => children.sort((a, b) => a.stat.ctime - b.stat.ctime),
};

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

		this.addCommand({
			id: "gotoheading-switcher-folder",
			name: "In folder: Open switcher",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.openHeadingSwitcherInFolder(editor, view);
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
			type: SuggestionType.Heading,
			text: heading.heading,
			heading: heading.heading,
			level: heading.level,
			line: heading.position.start.line
		}));

		modal.onChoose = (item) => {
			goAndScrollToLine(editor, (item as HeadingSuggestion).line);
			modal.close();
		};

		// Get the index of the nearest heading to the cursor
		const line = editor.getCursor().line;
		modal.defaultItemIndex = headings.findLastIndex(heading => heading.position.start.line <= line);
		modal.settings = this.settings;

		modal.open();
	}

	protected openHeadingSwitcherInFolder(editor: Editor, view: MarkdownView) {
		let sortMethodFn: HeadingFolderChildrenFn = (x => x);
		const sortMethodId = this.settings.fileSortOrder;
		if(FolderSortMethodIdentifiers.contains(sortMethodId)) {
			sortMethodFn = FolderSortMethodFn[FolderSortMethod[sortMethodId]];
		}
		const headings = headingsForActiveFolder(this.app, sortMethodFn);
		if(!headings.length) return;

		let modal = new HeadingModal(this.app);
		modal.setInstructions([
			{ command: "↑↓", purpose: "to navigate" },
			{ command: "↵", purpose: "to jump to file/heading" },
			{ command: "esc", purpose: "to dismiss" },
		]);
		modal.setPlaceholder("Go to file/heading...");

		let items: Suggestion[] = [];
		for(const heading of headings) {
			const f: FileSuggestion = {
				type: SuggestionType.File,
				text: fileNameWithoutPathOrExtension(heading.file.path),
				path: heading.file.path
			};

			items.push(f, ...heading.headings.map(heading => ({
				type: SuggestionType.Heading,
				text: heading.heading,
				heading: heading.heading,
				level: heading.level,
				line: heading.position.start.line,
				file: f
			})));
		}
		modal.items = items;

		modal.onChoose = async (item) => {
			switch(item.type) {
				case SuggestionType.File: {
					const s = item as FileSuggestion;
					await this.app.workspace.openLinkText(s.path, '', false);
					break;
				}
				case SuggestionType.Heading: {
					const s = item as HeadingSuggestion;
					if(s.file) {
						await this.app.workspace.openLinkText(s.file.path, '', false);
					}
					goAndScrollToLine(editor, s.line);
					break;
				}
			}
			modal.close();
		};

		// Get the index of the nearest heading to the cursor
		const line = editor.getCursor().line;
		const activeFilePath = this.app.workspace.getActiveFile()?.path;
		let idx = items.findLastIndex(item => 
			item.type == SuggestionType.Heading 
			&& (item as HeadingSuggestion).file?.path === activeFilePath
			&& (item as HeadingSuggestion).line <= line
			);
		if(idx < 0) {
			idx = items.findIndex(item => item.type == SuggestionType.File && (item as FileSuggestion).path === activeFilePath);
		}
		modal.defaultItemIndex = idx;
		modal.settings = this.settings;

		modal.open();
	}
}