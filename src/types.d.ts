export interface StorePage {
    store: 'CWS' | 'Edge' | null;
    storeURLPrefix: string,
    detailsURLPrefix: string,
    URLPattern: RegExp,
    titlePattern: RegExp,
    getDownloadURL: (extensionId: string) => string | Promise<string>,
}

export interface ExtensionStorePage {
    store: StorePage['store'];
    extensionName: string | null;
    extensionTechnicalName: string | null;
    extensionId: string | null;
    downloadURL: string | null;
}