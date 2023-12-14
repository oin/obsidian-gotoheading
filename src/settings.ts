export enum FolderSortMethod {
	ByNameAscending,
	ByNameDescending,
	ByModificationDateDescending,
	ByModificationDateAscending,
	ByCreationDateDescending,
	ByCreationDateAscending,
};
export type FolderSortMethodId = keyof typeof FolderSortMethod;
export const FolderSortMethodIdentifiers = Object.keys(FolderSortMethod).filter(x => isNaN(Number(x)));

export interface GotoHeadingSettings {
	highlightCurrentHeading: boolean;
	fileSortOrder: FolderSortMethodId;
	includeDocumentBoundaries: boolean;
}

export const DEFAULT_SETTINGS: GotoHeadingSettings = {
	highlightCurrentHeading: true,
	fileSortOrder: FolderSortMethod[FolderSortMethod.ByNameAscending] as FolderSortMethodId,
	includeDocumentBoundaries: false,
};
