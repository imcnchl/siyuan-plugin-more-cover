import {Dialog, I18N, IProtyle} from "siyuan";
import MoreCoverPlugin from "../index";

/**
 * 封面信息
 */
export class Cover {
    id: string;
    url: string;

    /**
     * 封面文件的后缀，如：png
     */
    format = "png";
    /**
     * 封面字节数据
     */
    blob: Blob;


    constructor(id: string, url: string, format: string, blob: Blob) {
        this.id = id;
        this.url = url;
        this.format = format;
        this.blob = blob;
    }
}

/**
 * 封面配置
 */
export abstract class CoverProviderConfig {
    id: string;
    name: string;
    enable: boolean;
    randomEnable: boolean;

    /**
     * 校验配置
     */
    abstract validate(i18n: I18N): readonly [boolean, string] ;
}

interface ImageInfo {
    id: string;
    username: string;
    thumbUrl: string;
    downloadUrl: string;
    htmlUrl: string;
    description: string;
}

export type BindHtmlEvent = {
    plugin: MoreCoverPlugin;
    dialog: Dialog;
    /**
     * 字符串对应的html元素
     */
    target: HTMLElement;
    /**
     * 搜索输入框
     */
    searchInput: HTMLInputElement;
    /**
     * 搜索按钮，可能为空
     */
    searchBtn: HTMLButtonElement;
}

export class PageResult {
    /**
     * 当前页码
     */
    pageNum: number;
    /**
     * 页大小
     */
    pageSize: number;
    /**
     * 总记录数量
     */
    total: number;
    /**
     * 封面列表
     */
    items: ImageInfo[];
    /**
     * 错误信息
     */
    errors: string[];

    constructor(pageNum: number, pageSize: number, total: number, items: ImageInfo[], errors: string[]) {
        this.pageNum = pageNum;
        this.pageSize = pageSize;
        this.total = total;
        this.items = items;
        this.errors = errors;
    }

    /**
     * 总页数
     */
    totalPageCount(): number {
        return Math.ceil(this.total / this.pageSize);
    }
}

export abstract class CoverProvider<CONFIG extends CoverProviderConfig> {
    /**
     * 配置信息
     */
    config: CONFIG;

    constructor(config: CONFIG) {
        this.config = config;
    }

    pageSize(): number {
        return 30;
    }

    /**
     * 最大随机数量
     */
    maxRandomTotal(): number {
        return 3000;
    }

    /**
     * 显示随机封面
     */
    abstract randomCovers(pageNum: number): Promise<PageResult>;

    /**
     * 搜索封面
     * @param keyword 关键字
     * @param pageNum 页码
     */
    abstract searchCovers(keyword: string, pageNum: number): Promise<PageResult>;

    /**
     * 下载封面
     * @param event
     */
    downloadCover(event: Event): Promise<Cover>{
        const target = event.target as HTMLElement;
        const id = target.dataset.imageId;
        const url = target.dataset.downloadUrl;
        return this.downloadCover2({id, url});
    }

   abstract downloadCover2(data: {id: string, url: string}): Promise<Cover> ;

    /**
     * 配置页面的HTML，注意：最外层元素的 class 需要符合：pmc-config-${this.config.id}
     */
    abstract makeSettingHtml(i18n: I18N,
                             saveSetting: Promise<HTMLElement>,
                             bindEvent: Promise<{
                                 plugin: MoreCoverPlugin;
                                 dialog: Dialog;
                                 target: HTMLElement
                             }>): string;

    getSettingHtml(dialog: Dialog): HTMLElement {
        return dialog.element.querySelector(`.pmc-config-${this.config.id}`);
    }

    /**
     * 在切换图库的下拉列表后面插入代码，注意：最外层元素的 class 需要符合：pmc-after-change-${this.config.id}
     * 示例代码：
     * `<div class="pmc-after-change-${this.config.id}">测试代码</div>`
     * @param i18n
     * @param bindEvent 绑定事件
     */
    makeAfterSelectHtml(i18n: I18N, bindEvent: Promise<BindHtmlEvent>): string {
        return "";
    }

    getAfterSelectHtml(dialog: Dialog): HTMLElement {
        return dialog.element.querySelector(`.pmc-after-change-${this.config.id}`);
    }

}