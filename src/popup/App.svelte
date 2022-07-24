<script lang="ts">
  import type { ExtensionStorePage } from '../types';
  import { getExtensionStorePageData } from './utils';

  let storePage: ExtensionStorePage = null;

  getExtensionStorePageData().then((page) => { storePage = page });

  function download() {
    chrome.downloads.download({
        url: storePage.downloadURL,
        filename: (storePage.extensionName || storePage.extensionName || 'extension') + '.crx' ,
        saveAs: true,
    });
  }
</script>

<main style="width: 200px; height: 200px;">
  { #if !storePage }
    This extension supports only Chrome Web Store and Edge Extension Store.
  { :else if storePage && !storePage.downloadURL }
    Please open page of a specific extension.
  { :else if storePage && storePage.downloadURL }
    <button on:click={download}>Download {storePage.extensionName}</button>
  { /if }
</main>
