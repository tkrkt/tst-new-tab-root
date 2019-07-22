import { browser } from "webextension-polyfill-ts";
import { TST_ID } from "./constants";

interface Props {
  delay: number;
  callback: (previousTabId: number, newTabId: number) => void;
}

export const listenNewTab = ({ delay, callback }: Props) => {
  let previousTabs: [number, number | undefined] = [0, 0];
  browser.tabs.onActivated.addListener(info => {
    previousTabs = [info.tabId, info.previousTabId];
  });
  const getPreviousTab = (newTabId: number): number | undefined => {
    if (previousTabs[0] === newTabId) {
      return previousTabs[1];
    } else {
      return previousTabs[0];
    }
  };

  const timer: { [key: number]: number } = {};
  browser.tabs.onCreated.addListener(tab => {
    if (tab.id) {
      const tabId = tab.id;
      timer[tabId] = setTimeout(async () => {
        delete timer[tabId];
        const previous = getPreviousTab(tabId);
        if (typeof previous === "number") {
          callback(previous, tabId);
        }
      }, delay);
    }
  });

  browser.runtime.onMessageExternal.addListener((message, sender) => {
    if (sender.id === TST_ID) {
      switch (message.type) {
        case "tree-attached":
          if (message.tab.id) {
            clearTimeout(timer[message.tab.id]);
            delete timer[message.tab.id];
          }
          break;
      }
    }
  });
};
