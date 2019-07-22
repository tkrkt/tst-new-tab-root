import { browser } from "webextension-polyfill-ts";
import { ROOT_CLASS, TST_ID } from "./constants";
const MENU_ID = "toggle_root";

interface Props {
  isRoot: (tabId: number) => boolean;
  setRoot: (tabId: number) => void;
  removeRoot: (tabId: number) => void;
}

export const addMenu = async ({ isRoot, setRoot, removeRoot }: Props) => {
  const clear = async () => {
    const tabs = await browser.tabs.query({ currentWindow: true });

    await browser.runtime.sendMessage(TST_ID, {
      type: "remove-tab-state",
      tabs: tabs.map(t => t.id).filter(id => typeof id === "number"),
      state: ROOT_CLASS
    });
  };

  browser.tabs.onRemoved.addListener(tabId => {
    removeRoot(tabId);
  });

  browser.menus.onShown.addListener(async (info, tab) => {
    if (typeof tab.id === "number") {
      const title = isRoot(tab.id)
        ? browser.i18n.getMessage("removeRootMenu")
        : browser.i18n.getMessage("setRootMenu");
      browser.menus.update(MENU_ID, { title, visible: !tab.pinned });
      browser.menus.refresh();
    }
  });

  const toggleRoot = async (tabId: number) => {
    if (isRoot(tabId)) {
      removeRoot(tabId);
      await browser.runtime.sendMessage(TST_ID, {
        type: "remove-tab-state",
        tabs: [tabId],
        state: ROOT_CLASS
      });
    } else {
      setRoot(tabId);
      await browser.runtime.sendMessage(TST_ID, {
        type: "add-tab-state",
        tabs: [tabId],
        state: ROOT_CLASS
      });
    }
  };

  await clear();
  return browser.menus.create({
    id: MENU_ID,
    title: "toggle root",
    contexts: ["tab"],
    onclick: (info, tab) => typeof tab.id === "number" && toggleRoot(tab.id)
  });
};
