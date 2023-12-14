import { App, Editor, TFolder, TFile, HeadingCache, TAbstractFile } from "obsidian";

export function headingsForActiveFile(app: App) {
	// Get the active file's headings from the File Cache
	const activeFile = app.workspace.getActiveFile();
	if(!activeFile) return undefined;
	const fileCache = app.metadataCache.getFileCache(activeFile);

	return fileCache?.headings;
}

export interface HeadingsForFolderItem {
	file: TFile;
	headings: HeadingCache[];
}
export type HeadingFolderChildrenFn = (children: TFile[]) => TFile[];

export function headingsForFolder(app: App, folder: TFolder, childrenFn: HeadingFolderChildrenFn = (x) => x): HeadingsForFolderItem[] {
	const files = folder.children.filter(x => x instanceof TFile) as TFile[];
	const subfolders = folder.children.filter(x => x instanceof TFolder) as TFolder[];
	return [
		...subfolders.map(x => headingsForFolder(app, x, childrenFn)).reduce((a, b) => a.concat(b), []),
		...childrenFn(files).map(x => ({
			file: x,
			headings: app.metadataCache.getFileCache(x)?.headings ?? []
		} as HeadingsForFolderItem))
	];
}

export function headingsForActiveFolder(app: App, childrenFn: HeadingFolderChildrenFn = (x) => x) {
	// Get the active folder's headings from the File Cache
	const activeFile = app.workspace.getActiveFile();
	if(!activeFile) return [];
	const activeFolder = activeFile.parent;
	if(!activeFolder) return [];

	return headingsForFolder(app, activeFolder, childrenFn);
}

export function fileNameWithoutPathOrExtension(path: string) {
	const fileName = path.split('/').pop();
	if(!fileName) return path;
	return fileName.split('.').slice(0, -1).join('.');
}

export function goAndScrollToLine(editor: Editor, line: number) {
	editor.setCursor(line);

	// Also scroll to the heading to ensure its contents are visible
	const position = editor.getCursor();
	var range = editor.wordAt(position) ?? { from: position, to: position };
	editor.scrollIntoView(range, true);
}