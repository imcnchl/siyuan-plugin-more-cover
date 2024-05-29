import {Cover, CoverProvider, CoverProviderConfig, PageResult} from "./CoverProvider";
import {I18N} from "siyuan";

export class PixabayConfig implements CoverProviderConfig {
    id = "pixabay";
    name = "Pixabay";
    enable = false;
    key = "";
    language = "en";

    validate(i18n: I18N): readonly [boolean, string] {
        if (!this.enable) {
            return [true, ""];
        }
        const msg: string[] = [];
        if (!this.key) {
            msg.push(i18n.pixabay.keyNotNull);
        }
        return msg.length <= 0 ? [true, ""] : [false, msg.join("\n")];
    }
}


export interface PixabayHit {
    id: number;
    pageURL: string;
    type: string;
    tags: string;
    previewURL: string;
    previewWidth: number;
    previewHeight: number;
    webformatURL: string;
    webformatWidth: number;
    webformatHeight: number;
    imageURL: string;
    largeImageURL: string;
    imageWidth: number;
    imageHeight: number;
    imageSize: number;
    views: number;
    downloads: number;
    collections: number;
    likes: number;
    comments: number;
    user_id: number;
    user: string;
    userImageURL: string;
}

export interface PixabayResp {
    total: number;
    totalHits: number;
    hits: PixabayHit[];
}

export class PixabayProvider implements CoverProvider<PixabayConfig> {
    config: PixabayConfig;

    constructor(config: PixabayConfig) {
        this.config = config;
    }

    randomCovers(): Promise<PageResult> {
        return Promise.resolve(undefined);
    }

    searchCovers(keyword: string, pageNum: number): Promise<PageResult> {
        const pageSize = 30;
        const url = `https://pixabay.com/api/?key=${this.config.key}&q=${keyword}&lang=${this.config.language}&page=${pageNum}&per_page=${pageSize}`;

        return new Promise<PageResult>((resolve, reject) => {
            fetch(url)
                .then(response => response.json())
                .then(rs => {
                    const response = rs as PixabayResp;
                    const pageResult = new PageResult(pageNum, pageSize, response.total, response.hits?.map(value => {
                        return {
                            id: value.id + "",
                            username: value.user,
                            thumbUrl: value.previewURL,
                            downloadUrl: value.largeImageURL || value.imageURL,
                            htmlUrl: value.pageURL,
                            description: value.tags
                        };
                    }), []);
                    resolve(pageResult);
                })
                .catch(reason => {
                    reject(reason);
                });

        });
    }

    downloadCover(event: Event): Promise<Cover> {
        const target = event.target as HTMLElement;
        const id = target.dataset.imageId;
        const url = target.dataset.downloadUrl;
        const format = "png";

        return new Promise<Cover>((resolve, reject) => {
            fetch(url)
                .then(response => {
                    return response.blob();
                })
                .then(blob => {
                    const cover = new Cover(id, url, format, blob);
                    resolve(cover);
                })
                .catch(reason => {
                    reject(reason);
                });
        });
    }

    settingHtml(i18n: I18N): string {
        return `
<fieldset class="pmc-config-${this.config.id}">
    <legend>&nbsp;${this.config.name}&nbsp;</legend>
    <div class="pmc-config_line">
        <label>${i18n.enable}:&nbsp;</label>
        <input type="checkbox" ${this.config.enable ? "checked" : ""} 
            class="pmc-config-enable pmc-switch b3-switch fn__flex-center"/>      
    </div>
    <div class="pmc-config_line">
        <label>Key:&nbsp;</label><input class="pmc-config-key" type="text" value="${this.config.key}" style="flex: 1">        
    </div>
</fieldset>
        `;
    }

    readSetting(html: HTMLElement): void {
        this.config.enable = (html.querySelector(".pmc-config-enable") as HTMLInputElement).checked;
        this.config.key = (html.querySelector(".pmc-config-key") as HTMLInputElement).value;
    }


}