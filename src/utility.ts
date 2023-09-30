import { App, Editor, HeadingCache } from "obsidian";

export function headingsForActiveFile(app: App) {
	// Get the active file's headings from the File Cache
	let activeFile = app.workspace.getActiveFile();
	if (!activeFile) return undefined;
	const fileCache = app.metadataCache.getFileCache(activeFile);

	return fileCache?.headings;
}

export function goAndScrollToLine(editor: Editor, line: number) {
	editor.setCursor(line);

	// Also scroll to the heading to ensure its contents are visible
	const position = editor.getCursor();
	const range = editor.wordAt(position);
	if (!range) return;
	editor.scrollIntoView(range, true);
}