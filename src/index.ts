import { browser } from "webextension-polyfill-ts";
import { listenNewTab } from "./listenNewTab";
import { TST_ID, ROOT_CLASS } from "./constants";
import { initRoot } from "./rootManager";
import { addMenu } from "./menu";

const main = async () => {
  const registerToTST = async () => {
    await browser.runtime.sendMessage(TST_ID, {
      type: "register-self",
      name: "tst-new-tab",
      listeningTypes: ["tree-attached"],
      style: `
        .tab.${ROOT_CLASS} .label:before {
          content: "🗂";
        }
      `,
      permissions: ["tabs"]
    });
  };

  browser.runtime.onMessageExternal.addListener((message, sender) => {
    switch (sender.id) {
      case TST_ID:
        switch (message.type) {
          case "ready":
          case "permissions-changed":
            registerToTST();
            break;
        }
        break;
    }
  });

  await registerToTST();

  const { isRoot, setRoot, removeRoot, findRoot } = initRoot();
  await addMenu({ isRoot, setRoot, removeRoot });
  listenNewTab({
    delay: 100,
    callback: async (previousTabId, newTabId) => {
      const root = await findRoot(previousTabId);
      if (typeof root === "number") {
        await browser.runtime.sendMessage(TST_ID, {
          type: "attach",
          parent: root,
          child: newTabId
        });
      }
    }
  });
};

main();
