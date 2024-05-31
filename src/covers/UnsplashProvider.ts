import {Cover, CoverProvider, CoverProviderConfig, PageResult} from "./CoverProvider";
import {Dialog, I18N} from "siyuan";
import MoreCoverPlugin from "../index";

export class UnsplashConfig implements CoverProviderConfig {
    id = "unsplash";
    name = "Unsplash";
    enable = false;
    applicationName = "";
    accessKey = "";
    randomEnable = true;
    randomOrderBy = "latest";

    validate(i18n: I18N): readonly [boolean, string] {
        if (!this.enable) {
            return [true, ""];
        }
        const msg: string[] = [];
        if (!this.applicationName) {
            msg.push(i18n.unsplash.applicationNameNotNull);
        }
        if (!this.accessKey) {
            msg.push(i18n.unsplash.accessKeyNotNull);
        }
        return msg.length <= 0 ? [true, ""] : [false, msg.join("\n")];
    }
}


interface UnsplashUrls {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
    small_s3: string;
}

interface UnsplashLinks {
    self: string;
    html: string;
    download: string;
    download_location: string;
}

interface UnsplashUserLinks {
    html: string;
}

interface UnsplashUser {
    id: string;
    name: string;
    links: UnsplashUserLinks;
}

interface UnsplashImage {
    id: string;
    description: string;
    alt_description: string;
    urls: UnsplashUrls;
    links: UnsplashLinks;
    user: UnsplashUser;
}

interface UnsplashResp {
    total: number;
    total_pages: number;
    results: UnsplashImage[];
    errors: string[];
}

export class UnsplashProvider extends CoverProvider<UnsplashConfig> {
    config: UnsplashConfig;

    randomCovers(pageNum: number): Promise<PageResult> {
        if (!this.config.randomEnable) {
            return Promise.resolve(undefined);
        }
        const pageSize = 30;
        const total = 3000;
        const url = `https://api.unsplash.com/photos?page=${pageNum}&per_page=${pageSize}&order_by=${this.config.randomOrderBy}&client_id=${this.config.accessKey}`;

        return new Promise<PageResult>((resolve, reject) => {
            fetch(url)
                .then(response => response.json())
                .then(rs => {
                    const images = rs as UnsplashImage[];
                    const pageResult = new PageResult(pageNum, pageSize, total, images?.map(value => {
                        return {
                            id: value.id,
                            username: value.user.name,
                            thumbUrl: `${value.urls.thumb}&utm_source=${this.config.applicationName}&utm_medium=referral`,
                            downloadUrl: `${value.links.download_location}&client_id=${this.config.accessKey}`,
                            htmlUrl: `${value.user.links.html}?utm_source=${this.config.applicationName}&utm_medium=referral`,
                            description: value.alt_description
                        };
                    }), []);
                    resolve(pageResult);

                })
                .catch(reason => {
                    reject(reason);
                });

        });
    }

    searchCovers(keyword: string, pageNum: number): Promise<PageResult> {
        const pageSize = 30;
        const url = `https://api.unsplash.com/search/photos?page=${pageNum}&per_page=${pageSize}&query=${keyword}&client_id=${this.config.accessKey}`;

        return new Promise<PageResult>((resolve, reject) => {
            fetch(url)
                .then(response => response.json())
                .then(rs => {
                    const response = rs as UnsplashResp;
                    const pageResult = new PageResult(pageNum, pageSize, response.total, response.results?.map(value => {
                        return {
                            id: value.id,
                            username: value.user.name,
                            thumbUrl: `${value.urls.thumb}&utm_source=${this.config.applicationName}&utm_medium=referral`,
                            downloadUrl: `${value.links.download_location}&client_id=${this.config.accessKey}`,
                            htmlUrl: `${value.user.links.html}?utm_source=${this.config.applicationName}&utm_medium=referral`,
                            description: value.alt_description
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

        return new Promise<Cover>((resolve, reject) => {
            fetch(url)
                .then(async response => {
                    const r = await response.json();
                    const downloadUrl = r.url as string;

                    const v = await fetch(downloadUrl);
                    const blob = await v.blob();

                    let format = "png";
                    if (downloadUrl.indexOf("fm=") != -1) {
                        format = downloadUrl.substring(downloadUrl.indexOf("fm=") + 3);
                        format = format.substring(0, format.indexOf("&"));
                    } else {
                        format = blob.type.substring(blob.type.lastIndexOf("/"));
                    }

                    const cover = new Cover(id, downloadUrl, format, blob);
                    resolve(cover);
                })
                .catch(reason => {
                    reject(reason);
                });
        });
    }

    makeSettingHtml(i18n: I18N,
                    saveSetting: Promise<HTMLElement>,
                    bindEvent: Promise<{
                        plugin: MoreCoverPlugin;
                        dialog: Dialog;
                        target: HTMLElement
                    }>): string {

        const options = i18n.unsplash.randomOrderOptions as Map<string, string>;
        let selectOptionHtml = `<select class="pmc-setting-${this.config.id}-random-order-by">`;
        options.forEach((code, name) => {
            selectOptionHtml += `<option value="${code}" ${code == this.config.randomOrderBy ? "selected" : ""}>${name}</option>`;
        });
        selectOptionHtml += "</select>";

        saveSetting.then(html => {
            this.config.enable = (html.querySelector(`.pmc-setting-${this.config.id}-enable`) as HTMLInputElement).checked;
            this.config.applicationName = (html.querySelector(".pmc-config-application-name") as HTMLInputElement).value ?? "";
            this.config.accessKey = (html.querySelector(".pmc-config-key") as HTMLInputElement).value;
            this.config.randomEnable = (html.querySelector(`.pmc-setting-${this.config.id}-random-enable`) as HTMLInputElement).checked;
            const select = html.querySelector(`.pmc-setting-${this.config.id}-random-order-by`) as HTMLSelectElement;
            this.config.randomOrderBy = select.options[select.selectedIndex].value;
        });

        return `
<fieldset class="pmc-config-${this.config.id}">
    <legend>&nbsp;${this.config.name}&nbsp;</legend>
    <div class="pmc-config_line">
        <label>${i18n.enable}:&nbsp;</label>
        <input type="checkbox" ${this.config.enable ? "checked" : ""} 
            class="pmc-config-enable pmc-switch b3-switch fn__flex-center pmc-setting-${this.config.id}-enable"/>      
    </div>
    <div class="pmc-config_line">
        <label>Application Name:&nbsp;</label>
        <input class="pmc-config-application-name" type="text" value="${this.config.applicationName ?? ""}" style="flex: 1">        
    </div>
    <div class="pmc-config_line">
        <label>Access Key:&nbsp;</label>
        <input class="pmc-config-key" type="text" value="${this.config.accessKey}" style="flex: 1">        
    </div>
    <div class="pmc-config_line">
        <label>${i18n.unsplash.randomEnable}:&nbsp;</label>
        <input type="checkbox" ${this.config.randomEnable ? "checked" : ""} 
            class="pmc-config-enable pmc-switch b3-switch fn__flex-center pmc-setting-${this.config.id}-random-enable"/>      
    </div>
     <div class="pmc-config_line">
        <label>${i18n.unsplash.randomEnable}:&nbsp;</label>
        ${selectOptionHtml}
    </div>
</fieldset>
`;
    }

}