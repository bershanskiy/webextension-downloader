import type { StorePage, ExtensionStorePage } from "../types";

async function getChromiumNaClArch(): Promise<chrome.runtime.PlatformNaclArch> {
    const platformInfo = await chrome.runtime.getPlatformInfo();
    return platformInfo.nacl_arch;
}

// Note: Edge has a custom UA string, but this will output underlying Chromium equivalent version
async function getChromiumVersion() {
    let version: string | null = null;
    // navigator.userAgentData.getHighEntropyValues() might decide to refuse to provide info and throw instead
    try {
        version = (await (navigator as any).userAgentData.getHighEntropyValues(["fullVersionList"]))
        .fullVersionList.filter((model: any) => model.brand === 'Chromium' || model.brand === 'Google Chrome')
        .map((model: any) => model.version)[0];
        if (typeof version !== 'string') {
            throw new Error('fallback');
        }
    } catch {
        // Fall back to the old navigator.userAgent
        const match = navigator.userAgent.match('Chrom(e|ium)/(?<version>[0-9\.]+)');
        if (match?.groups?.version) {
            version = match?.groups?.version;
            if (version.endsWith('.0.0.0')) {
                console.error('Could not find out exact browser version got only major version', version);
            }
        } else {
            console.error('Could not find out browser version, defaulting to 100.0.0.0.');
            version = '100.0.0.0';
        }
    }
    return version;
}



export const stores: Array<StorePage> = [
    {
        store: 'CWS',
        storeURLPrefix: 'https://chrome.google.com/',
        detailsURLPrefix: 'https://chrome.google.com/webstore/detail/',
        URLPattern: /^https:\/\/chrome.google.com\/webstore\/detail\/(?<extensionName>.+)\/(?<extensionId>[a-z]{32})(?=[\/#?]|$)/,
        titlePattern: /(?<extensionName>.+) - Chrome Web Store$/,
        getDownloadURL: async (extensionId: string) => {
            const [chromiumVersion, NaClArch] = await Promise.all([getChromiumVersion(), getChromiumNaClArch()]);
            return `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${chromiumVersion}&x=id%3D${extensionId}%26installsource%3Dondemand%26uc&nacl_arch=${NaClArch}&acceptformat=crx2,crx3`;
        },
    },
    {
        store: 'Edge',
        storeURLPrefix: 'https://microsoftedge.microsoft.com/',
        detailsURLPrefix: 'https://microsoftedge.microsoft.com/addons/detail/',
        URLPattern: /^https:\/\/microsoftedge.microsoft.com\/addons\/detail\/(?<extensionName>.+)\/(?<extensionId>[a-z]{32})(?=[\/#?]|$)/,
        titlePattern: /^(?<extensionName>.+) - Microsoft Edge Addons$/,
        getDownloadURL: (extensionId: string) => {
            return `https://edge.microsoft.com/extensionwebstorebase/v1/crx?response=redirect&prod=chromiumcrx&prodchannel=&x=id%3D${extensionId}%26installsource%3Dondemand%26uc`;
        },
    }
];

export const getExtensionStorePageData = async (): Promise<ExtensionStorePage | null> => {
    const extractData = async (url: string, title: string): Promise<ExtensionStorePage> => {
        for (const { store, storeURLPrefix, URLPattern, titlePattern, getDownloadURL } of stores) {
            if (url.startsWith(storeURLPrefix)) {
                const titleMatch = title.match(titlePattern);
                const URLMatch = url.match(URLPattern);
                return {
                    store,
                    extensionName: titleMatch?.groups.extensionName,
                    extensionId: URLMatch?.groups?.extensionId,
                    extensionTechnicalName: URLMatch?.groups?.extensionName,
                    downloadURL: URLMatch?.groups?.extensionId && await getDownloadURL(URLMatch?.groups?.extensionId) || null,
                };
            }
        }

        return null;
    };

    return new Promise((resolve) => {
        chrome.tabs.query({
            active: true,
            lastFocusedWindow: true,
            url: stores.map((store) => `${store.detailsURLPrefix}*`),
        }, (tabs) => {
            tabs = tabs.filter((tab) => Boolean(tab.url));
            let url = '', title = '';
            if (tabs.length === 1) {
                url = tabs[0].url;
                title = tabs[0].title;
            } else if (tabs.length === 1) {
                console.warn('Tab URL unknown.');
            } else if (tabs.length > 0) {
                console.warn('Ambiguous tab. Will assume the first one is the right one.', tabs);
                url = tabs[0].url;
                title = tabs[0].title;
            }
            resolve(extractData(url, title));
        });
    });
};


