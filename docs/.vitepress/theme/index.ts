// https://vitepress.dev/guide/custom-theme
import { render, h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import BackToTop from "../../../components/internal/BackToTop.vue";
import "./style.css";

import { handleDetailsAnimation } from "./composables/details";
import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client";
import "@nolebase/vitepress-plugin-git-changelog/client/style.css";

import {
  LayoutMode,
  NolebaseEnhancedReadabilitiesMenu,
  NolebaseEnhancedReadabilitiesScreenMenu,
} from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import type { Options } from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import { InjectionKey } from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import { NolebaseInlineLinkPreviewPlugin } from "@nolebase/vitepress-plugin-inline-link-preview/client";
import { NolebaseHighlightTargetedHeading } from "@nolebase/vitepress-plugin-highlight-targeted-heading/client";

import "@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css";
import "@nolebase/vitepress-plugin-inline-link-preview/client/style.css";
import "@nolebase/vitepress-plugin-highlight-targeted-heading/client/style.css";
import "@nolebase/vitepress-plugin-enhanced-mark/client/style.css";

function addBackTotop() {
  render(
    h(BackToTop, {
      threshold: 300,
    }),
    document.body,
  );
}

function addDetailsAnimation() {
  document
    .querySelectorAll("details")
    .forEach((details) => handleDetailsAnimation(details));
}

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      "nav-bar-content-after": () => h(NolebaseEnhancedReadabilitiesMenu),
      // 为较窄的屏幕（通常是小于 iPad Mini）添加阅读增强菜单
      "nav-screen-content-after": () =>
        h(NolebaseEnhancedReadabilitiesScreenMenu),
      "layout-top": () => [h(NolebaseHighlightTargetedHeading)],
    });
  },
  enhanceApp({ app, router, siteData }) {
    if (typeof window !== "undefined") {
      window.addEventListener("load", () => {
        addBackTotop();
      });

      router.onAfterRouteChange = () => {
        setTimeout(() => {
          addDetailsAnimation();
        }, 0);
      };
    }
    app.use(NolebaseGitChangelogPlugin, {
      hideContributorsHeader: false,
      hideChangelogHeader: true,
    });
    app.use(NolebaseInlineLinkPreviewPlugin);
    app.provide(InjectionKey, {
      spotlight: {
        defaultToggle: true,
      },
      layoutSwitch: {
        defaultMode: LayoutMode.FullWidth,
      },
      locales: {
        "zh-CN": {
          title: {
            title: "阅读增强",
          },
        },
        en: {
          title: {
            title: "Enhanced Readabilities",
          },
        },
      },
    } as Options);
  },
} satisfies Theme;
