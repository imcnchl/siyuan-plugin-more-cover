import {I18N, IProtyle} from "siyuan";

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

export abstract class CoverProvider<CONFIG> {
    /**
     * 配置信息
     */
    config: CONFIG;

    /**
     * 显示随机封面
     */
    abstract randomCovers(): Promise<PageResult>;

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
    abstract downloadCover(event: Event): Promise<Cover>;

}