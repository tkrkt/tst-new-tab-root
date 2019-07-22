import { browser } from "webextension-polyfill-ts";
import { TST_ID } from "./constants";

export const initRoot = () => {
  const roots: { [key: number]: boolean } = {};

  const isRoot = (tabId: number): boolean => {
    return roots[tabId];
  };

  const setRoot = (tabId: number) => {
    roots[tabId] = true;
  };

  const removeRoot = (tabId: number) => {
    delete roots[tabId];
  };

  interface TreeItem {
    id: number;
    children: TreeItem[];
  }

  const isParent = (tabId: number, tree: TreeItem): boolean => {
    if (tree.id === tabId) {
      return true;
    } else {
      return tree.children.some(c => isParent(tabId, c));
    }
  };

  const getDepth = (tabId: number, tree: TreeItem): number => {
    if (tree.id === tabId) {
      return 0;
    } else if (tree.children.length) {
      return Math.min(...tree.children.map(c => getDepth(tabId, c) + 1));
    } else {
      return Number.MAX_SAFE_INTEGER;
    }
  };

  const findRoot = async (tabId: number): Promise<number> => {
    const rootTabIds = Object.keys(roots);
    if (rootTabIds.length) {
      const tabs: TreeItem[] = await browser.runtime.sendMessage(TST_ID, {
        type: "get-tree",
        tabs: "*"
      });
      const { root, depth } = tabs
        .filter(t => roots[t.id])
        .reduce(
          (
            acc: { root: number | undefined; depth: number },
            tree: TreeItem
          ) => {
            const d = getDepth(tabId, tree);
            if (d < acc.depth) {
              return { root: tree.id, depth: d };
            } else {
              return acc;
            }
          },
          { root: void 0, depth: Number.MAX_SAFE_INTEGER }
        );

      if (typeof root === "number" && depth < Number.MAX_SAFE_INTEGER) {
        return root;
      } else {
        throw new Error("not found");
      }
    } else {
      throw new Error("not found");
    }
  };

  return {
    isRoot,
    setRoot,
    removeRoot,
    findRoot
  };
};
