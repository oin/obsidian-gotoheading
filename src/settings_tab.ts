import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import GotoHeadingPlugin from "./main";
import { FolderSortMethod, FolderSortMethodId, FolderSortMethodIdentifiers } from "./settings";

const FolderSortMethodName: {[method in FolderSortMethod]: string} = {
	[FolderSortMethod.ByNameAscending]: "File name (A to Z)",
	[FolderSortMethod.ByNameDescending]: "File name (Z to A)",
	[FolderSortMethod.ByModificationDateDescending]: "Modified time (new to old)",
	[FolderSortMethod.ByModificationDateAscending]: "Modified time (old to new)",
	[FolderSortMethod.ByCreationDateDescending]: "Creation date (new to old)",
	[FolderSortMethod.ByCreationDateAscending]: "Creation date (old to new)",
};

export class GotoHeadingSettingTab extends PluginSettingTab {
	plugin: GotoHeadingPlugin;

	constructor(app: App, plugin: GotoHeadingPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Previous/Next Settings" });

		new Setting(containerEl)
			.setName("Include first/last line")
			.setDesc("Go to the last line after the last heading, and the first line before the first heading")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.includeDocumentBoundaries)
					.onChange(async (value) => {
						this.plugin.settings.includeDocumentBoundaries = toggle.getValue();
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl("h2", { text: "Switcher Settings" });
		
		new Setting(containerEl)
			.setName("Highlight current heading")
			.setDesc("Emphasize the current heading in the switcher")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.highlightCurrentHeading)
					.onChange(async (value) => {
						this.plugin.settings.highlightCurrentHeading = toggle.getValue();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("File sort order")
			.setDesc("How to sort files in the 'In folder' switcher")
			.addDropdown((dropdown) => {
				const ids = Object.keys(FolderSortMethodName).forEach((key, index) => {
					dropdown.addOption(FolderSortMethod[index], FolderSortMethodName[index as FolderSortMethod]);
				});
				dropdown
					.setValue(this.plugin.settings.fileSortOrder)
					.onChange(async (value) => {
						if(!FolderSortMethodIdentifiers.contains(value)) return;
						
						this.plugin.settings.fileSortOrder = value as FolderSortMethodId;
						await this.plugin.saveSettings();
					});
			});
	}
}