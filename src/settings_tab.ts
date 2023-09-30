import { App, PluginSettingTab, Setting } from "obsidian";
import GotoHeadingPlugin from "./main";

export class GotoHeadingSettingTab extends PluginSettingTab {
	plugin: GotoHeadingPlugin;

	constructor(app: App, plugin: GotoHeadingPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		let { containerEl } = this;

		containerEl.empty();
		
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
	}
}