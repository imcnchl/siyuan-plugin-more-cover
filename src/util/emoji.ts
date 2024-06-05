import {getDockByType} from "./dock";
import {Siyuan} from "../index";

// 以下代码拷贝自思源笔记，有改动

export interface IEmoji {
    id: string,
    title: string,
    title_zh_cn: string,
    items: {
        unicode: string,
        description: string,
        description_zh_cn: string,
        keywords: string
    }[]
}

const getRandom = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min; //含最大值，含最小值
};

export const getRandomEmoji = (allowIds: string[]): string => {
    const siyuan = window.siyuan as Siyuan;
    const emojisList = siyuan.emojis.filter(value => allowIds.indexOf(value.id) >= 0);
    const emojis = emojisList[getRandom(0, emojisList.length - 1)];
    if (typeof emojis.items[getRandom(0, emojis.items.length - 1)] === "undefined") {
        return "1f600";
    }
    return emojis.items[getRandom(0, emojis.items.length - 1)].unicode;
};

export const unicode2Emoji = (unicode: string, className = "", needSpan = false, lazy = false) => {
    if (!unicode) {
        return "";
    }
    let emoji = "";
    if (unicode.indexOf(".") > -1) {
        emoji = `<img class="${className}" ${lazy ? "data-" : ""}src="/emojis/${unicode}"/>`;
    } else {
        try {
            unicode.split("-").forEach(item => {
                if (item.length < 5) {
                    emoji += String.fromCodePoint(parseInt("0" + item, 16));
                } else {
                    emoji += String.fromCodePoint(parseInt(item, 16));
                }
            });
            if (needSpan) {
                emoji = `<span class="${className}">${emoji}</span>`;
            }
        } catch (e) {
            // 自定义表情搜索报错 https://github.com/siyuan-note/siyuan/issues/5883
            // 这里忽略错误不做处理
        }
    }
    return emoji;
};

export const updateFileTreeEmoji = (unicode: string, id: string, icon = "iconFile") => {
    let emojiElement;
    /// #if MOBILE
    emojiElement = document.querySelector(`#sidebar [data-type="sidebar-file"] [data-node-id="${id}"] .b3-list-item__icon`);
    /// #else
    const dockFile = getDockByType("file");
    if (dockFile) {
        const files = dockFile.data.file as { element: HTMLElement, closeElement: HTMLElement };
        if (icon === "iconFile") {
            emojiElement = files.element.querySelector(`[data-node-id="${id}"] .b3-list-item__icon`);
        } else {
            emojiElement = files.element.querySelector(`[data-node-id="${id}"] .b3-list-item__icon`) || files.element.querySelector(`[data-url="${id}"] .b3-list-item__icon`) || files.closeElement.querySelector(`[data-url="${id}"] .b3-list-item__icon`);
        }
    }
    /// #endif
    if (emojiElement) {
        emojiElement.innerHTML = unicode2Emoji(unicode || (icon === "iconFile" ? (emojiElement.previousElementSibling.classList.contains("fn__hidden") ? "1f4c4" : "1f4d1") : "1f5c3"));
    }
};

