import { App, Editor, FuzzyMatch, FuzzySuggestModal, Notice, setIcon } from "obsidian";
import { GotoHeadingSettings } from "./settings";

interface HeadingSuggestion {
	heading: string;
	level: number;
	line: number;
}

type HeadingModalCallback = (item: HeadingSuggestion) => void;

export class HeadingModal extends FuzzySuggestModal<HeadingSuggestion> {
	public items: HeadingSuggestion[] = [];
	public defaultItemIndex: number = -1;
	public onChoose: HeadingModalCallback;
	public settings: GotoHeadingSettings;

	onOpen() {
		super.onOpen();

		if(this.defaultItemIndex >= 0 && this.defaultItemIndex < this.items.length) {
			//FIXME: This is a hack to select the default item, while we wait for a proper API
			let chooser = (this as any)['chooser'];
			for(let i = 0; i < this.defaultItemIndex; i++) {
				chooser['moveDown'](new KeyboardEvent("keydown", { key: "ArrowDown" }));
			}

			//FIXME: Add a class to style the default item
			// const el = chooser['suggestions'][this.defaultItemIndex];
			// el.classList.add("join-gotoheading-headingmodal-suggestion-default");
		}
	}

	getItems(): HeadingSuggestion[] {
		return this.items;
	}

	getItemText(item: HeadingSuggestion): string {
		return item.heading;
	}

	onChooseItem(item: HeadingSuggestion, evt: MouseEvent | KeyboardEvent): void {
		this.onChoose?.(item);
	}

	renderSuggestion(item: FuzzyMatch<HeadingSuggestion>, el: HTMLElement): void {
		const isSearching = this.inputEl.value.length > 0;
		const level = item.item.level;
		const iconName = level >= 1 && level <= 6 ? `heading-${level}` : "heading";
		
		el.classList.add("join-gotoheading-headingmodal-suggestion");

		if(this.settings.highlightCurrentHeading && this.defaultItemIndex >= 0 && this.items.indexOf(item.item) == this.defaultItemIndex) {
			el.classList.add("join-gotoheading-headingmodal-suggestion-default");
		}

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
			let smallEl = el.createEl("small", { text: this.parentHeadingString(item.item), cls: "path" });
		} else {
			let smallEl = el.createEl("small", { cls: "icon" });
			setIcon(smallEl, iconName);
		}
	}

	protected parentHeadingString(item: HeadingSuggestion): string {
		let string = "";

		while(item) {
			const parentIndex = this.items.findLastIndex(
				heading => heading.line < item.line
				&& heading.level < item.level
				);
			if(parentIndex < 0) break;
			const parent = this.items[parentIndex];

			if(string.length > 0) {
				string = `${parent.heading} > ${string}`;
			} else {
				string = parent.heading;
			}
			item = parent;
		}

		return string;
	}
}