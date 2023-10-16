import { App, Editor, FuzzyMatch, FuzzySuggestModal, Notice, setIcon } from "obsidian";
import { GotoHeadingSettings } from "./settings";

export enum SuggestionType {
	File,
	Heading,
};

export interface FileSuggestion {
	type: SuggestionType;
	text: string;

	path: string;
}

export interface HeadingSuggestion {
	type: SuggestionType;
	text: string;
	
	heading: string;
	level: number;
	line: number;
	file?: FileSuggestion;
}

export type Suggestion = HeadingSuggestion | FileSuggestion;

type HeadingModalCallback = (item: Suggestion) => void;

export class HeadingModal extends FuzzySuggestModal<Suggestion> {
	public items: Suggestion[] = [];
	public defaultItemIndex: number = -1;
	public onChoose: HeadingModalCallback;
	public settings: GotoHeadingSettings;

	onOpen() {
		super.onOpen();

		if(this.defaultItemIndex >= 0 && this.defaultItemIndex < this.items.length) {
			//FIXME: This is a hack to select the default item, while we wait for a proper API
			let chooser = (this as any)['chooser'];
			if(this.defaultItemIndex <= this.items.length / 2) {
				for(let i = 0; i < this.defaultItemIndex; i++) {
					chooser['moveDown'](new KeyboardEvent("keydown", { key: "ArrowDown" }));
				}
			} else {
				for(let i = this.items.length - 1; i >= this.defaultItemIndex; --i) {
					chooser['moveUp'](new KeyboardEvent("keydown", { key: "ArrowUp" }));
				}
			}
		}
	}

	getItems(): Suggestion[] {
		return this.items;
	}

	getItemText(item: Suggestion): string {
		return item.text;
	}

	onChooseItem(item: Suggestion, evt: MouseEvent | KeyboardEvent): void {
		this.onChoose?.(item);
	}

	renderSuggestion(item: FuzzyMatch<Suggestion>, el: HTMLElement): void {
		el.classList.add("join-gotoheading-headingmodal-suggestion");

		if(this.settings.highlightCurrentHeading && this.defaultItemIndex >= 0 && this.items.indexOf(item.item) == this.defaultItemIndex) {
			el.classList.add("join-gotoheading-headingmodal-suggestion-default");
		}
		
		switch(item.item.type) {
			case SuggestionType.File:
				return this.renderFileSuggestion(item, el);
			case SuggestionType.Heading:
				return this.renderHeadingSuggestion(item, el);
		}
	}

	protected renderFileSuggestion(item: FuzzyMatch<Suggestion>, el: HTMLElement) {
		const s = item.item as FileSuggestion;

		const isSearching = this.inputEl.value.length > 0;
		
		el.classList.add("join-gotoheading-headingmodal-suggestion");
		el.classList.add("join-gotoheading-headingmodal-suggestion-file");
		if(isSearching) {
			el.classList.add("join-gotoheading-headingmodal-suggestion-searching");
		}

		// setIcon(el, "file-text");

		const titleEl = el.createSpan({ cls: "title"});
		super.renderSuggestion(item, titleEl);

		let smallEl = el.createEl("small", { cls: "icon" });
		setIcon(smallEl, "file-text");
	}

	protected renderHeadingSuggestion(item: FuzzyMatch<Suggestion>, el: HTMLElement) {
		const s = item.item as HeadingSuggestion;
		
		const isSearching = this.inputEl.value.length > 0;
		const level = s.level;
		const iconName = level >= 1 && level <= 6 ? `heading-${level}` : "heading";

		if(isSearching) {
			// Set a heading icon
			setIcon(el, iconName);
		} else {
			// Use a spacer to represent the heading level
			el.createDiv({
				text: "#".repeat(level),
				cls: "join-gotoheading-headingmodal-suggestion-spacer"
			});
		}

		// Display title as rendered by FuzzySuggestModal
		const titleEl = el.createSpan({ cls: "title"});
		super.renderSuggestion(item, titleEl);

		// If a search is ongoing, display parent heading information
		if(isSearching) {
			el.createEl("small", { text: this.parentHeadingString(s), cls: "path" });
		} else {
			let smallEl = el.createEl("small", { cls: "icon" });
			setIcon(smallEl, iconName);
		}
	}

	protected parentHeadingString(item: HeadingSuggestion): string {
		let string = "";

		if(item.file) {
			string = item.file.text;
		}

		while(item) {
			const parentIndex = this.items.findLastIndex(
				heading =>
					heading.type == SuggestionType.Heading
					&& (heading as HeadingSuggestion).line < item.line
					&& (heading as HeadingSuggestion).level < item.level
				);
			if(parentIndex < 0) break;
			const parent = this.items[parentIndex];
			if(parent.type != SuggestionType.Heading) break;

			if(string.length > 0) {
				string = `${(parent as HeadingSuggestion).heading} > ${string}`;
			} else {
				string = (parent as HeadingSuggestion).heading;
			}
			item = parent as HeadingSuggestion;
		}

		return string;
	}
}