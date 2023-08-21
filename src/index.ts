import {Dialog, fetchPost, getFrontend, IObject, Plugin, showMessage} from "siyuan";
import "./index.scss";

const STORAGE_NAME = "more-cover-config";

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

interface UnsplashUser {
    id: string;
    name: string;
}

interface UnsplashImage {
    id: string;
    description: string;
    alt_description: string;
    urls: UnsplashUrls;
    links: UnsplashLinks;
    user: UnsplashUser
}

interface UnsplashResp {
    total: number;
    total_pages: number;
    results: UnsplashImage[];
    errors: string[];
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

interface ImageInfo {
    id: string;
    username: string;
    thumbUrl: string;
    downloadUrl: string;
    htmlUrl: string;
    description: string;
}

interface PageInfo {
    total: number;
    items: ImageInfo[];
    errors: string[]
}

interface Background {
    element: HTMLElement;
    ial: IObject;
    imgElement: HTMLImageElement;
    iconElement: HTMLElement;
    tagsElement: HTMLElement;
    transparentData: string
}

class Config {
    /**
     * 需要和 Configs 的 key 名称一致
     */
    id: string;
    name: string;
    enable: boolean;
    /**
     * 分页查询图片的接口地址
     */
    pageApi: string;
    /**
     * 每页大小
     */
    pageSize: number;
}

class UnsplashConfig extends Config {
    id = "unsplash";
    name = "Unsplash";
    enable = false;
    pageApi = "https://api.unsplash.com/search/photos?page={{pageNum}}&per_page={{pageSize}}&query={{searchValue}}&client_id={{accessKey}}";
    pageSize = 30;
    accessKey = "";
}

class PixabayConfig extends Config {
    id = "pixabay";
    name = "Pixabay";
    enable = false;
    pageApi = "https://pixabay.com/api/?key={{key}}&q={{searchValue}}&lang={{language}}&page={{pageNum}}&per_page={{pageSize}}";
    pageSize = 30;
    key = "";
    language = "en";
}

class Configs {
    common = {
        autoSearch: false,
        selectedId: ""
    };
    unsplash: UnsplashConfig = new UnsplashConfig();
    pixabay: PixabayConfig = new PixabayConfig();
}

export default class MoreCoverPlugin extends Plugin {

    private isMobile: boolean;

    onload() {
        this.data[STORAGE_NAME] = new Configs();

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        // 图标的制作参见帮助文档
        this.addIcons(`
<symbol id="iconMoreCover" viewBox="0 0 32 32">
    <path d="M6.659 1.333c0.681 0.001 1.242 0.512 1.322 1.171l0.001 0.006 0.009 0.156-0.001 2.667h12.027c3.577 0.003 6.494 2.824 6.65 6.363l0 0.014 0.005 0.289v12h2.663c0.736 0.001 1.332 0.597 1.332 1.333 0 0.681-0.51 1.243-1.169 1.323l-0.006 0.001-0.157 0.009h-2.663v2.667c-0.017 0.723-0.607 1.304-1.333 1.304-0.671 0-1.226-0.495-1.319-1.14l-0.001-0.007-0.008-0.156v-2.667h-12.025c-3.577-0.003-6.494-2.824-6.65-6.363l-0-0.014-0.005-0.289-0.001-12h-2.661c-0.736-0.001-1.332-0.597-1.332-1.333 0-0.681 0.51-1.243 1.169-1.323l0.006-0.001 0.157-0.009h2.661v-2.667c0-0.736 0.596-1.333 1.332-1.333h0zM7.989 8v12c0 0.001 0 0.002 0 0.003 0 2.124 1.657 3.861 3.749 3.99l0.011 0.001 0.235 0.007h12.025v-12c0-0.001 0-0.002 0-0.003 0-2.124-1.656-3.861-3.747-3.99l-0.011-0.001-0.235-0.007h-12.027z"></path>
    <path d="M10.667 12c0-0.736 0.597-1.333 1.333-1.333s1.333 0.597 1.333 1.333v0c0 0.736-0.597 1.333-1.333 1.333s-1.333-0.597-1.333-1.333v0zM10.735 20.235c-0.043-0.086-0.068-0.187-0.068-0.294 0-0.146 0.047-0.28 0.126-0.39l-0.001 0.002 3.337-4.64c0.115-0.161 0.301-0.265 0.511-0.265 0.189 0 0.358 0.084 0.473 0.216l0.001 0.001 0.287 0.329c0.116 0.132 0.285 0.215 0.473 0.215 0.197 0 0.374-0.091 0.489-0.234l0.001-0.001 0.813-1.009c0.116-0.144 0.293-0.236 0.491-0.236 0.235 0 0.44 0.129 0.548 0.321l0.002 0.003 3.031 5.36c0.054 0.094 0.086 0.207 0.086 0.328s-0.031 0.232-0.086 0.329l0.002-0.003c-0.109 0.196-0.315 0.326-0.55 0.328h-9.395c-0.249-0.001-0.463-0.146-0.566-0.355l-0.002-0.004z"></path>
</symbol>`);

    }

    openSetting() {
        const config = this.getConfig();
        const configHtml = `
<div class="pmc-config">
    <fieldset class="pmc-config_common">
        <legend>&nbsp;${this.i18n.common}&nbsp;</legend>
        <div class="pmc-config_line">
            <label>${this.i18n.autoSearch}:&nbsp;</label>
            <input type="checkbox" ${config.common.autoSearch ? "checked" : ""} 
            class="pmc-config_enable pmc-switch ${config.common.autoSearch ? "pmc-switch_check" : "pmc-switch_uncheck"}"/>      
        </div>
    </fieldset>
    <fieldset class="pmc-config_unsplash">
        <legend>&nbsp;${config.unsplash.name}&nbsp;</legend>
        <div class="pmc-config_line">
            <label>${this.i18n.enable}:&nbsp;</label>
            <input type="checkbox" ${config.unsplash.enable ? "checked" : ""} 
            class="pmc-config_enable pmc-switch ${config.unsplash.enable ? "pmc-switch_check" : "pmc-switch_uncheck"}"/>      
        </div>
        <div class="pmc-config_line">
            <label>Access Key:&nbsp;</label>
            <input class="pmc-config_key" type="text" value="${config.unsplash.accessKey}" style="flex: 1">        
        </div>
    </fieldset>
    <fieldset class="pmc-config_pixabay">
        <legend>&nbsp;${config.pixabay.name}&nbsp;</legend>
        <div class="pmc-config_line">
            <label>${this.i18n.enable}:&nbsp;</label>
            <input type="checkbox" ${config.pixabay.enable ? "checked" : ""} 
            class="pmc-config_enable pmc-switch ${config.pixabay.enable ? "pmc-switch_check" : "pmc-switch_uncheck"}"/>      
        </div>
        <div class="pmc-config_line">
            <label>Key:&nbsp;</label><input class="pmc-config_key" type="text" value="${config.pixabay.key}" style="flex: 1">        
        </div>
    </fieldset>
</div>        
        `;

        const dialog = new Dialog({
            title: `${this.displayName}${this.i18n.config}`,
            content: `<div class="b3-dialog__content">${configHtml}</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${this.i18n.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${this.i18n.save}</button>
</div>`,
            width: this.isMobile ? "92vw" : "520px",
        });
        const allSwitch = dialog.element.querySelectorAll(".pmc-switch");
        allSwitch.forEach((value) => {
            value.addEventListener("change", evt => {
                const target = evt.target as HTMLElement;
                // @ts-ignore
                if (target.checked) {
                    target.classList.add("pmc-switch_check");
                    target.classList.remove("pmc-switch_uncheck");
                } else {
                    target.classList.add("pmc-switch_uncheck");
                    target.classList.remove("pmc-switch_check");
                }
            });
        });

        const buttons = dialog.element.querySelectorAll(".b3-button");
        buttons[0].addEventListener("click", () => {
            dialog.destroy();
        });
        buttons[1].addEventListener("click", () => {
            const common = dialog.element.querySelector(".pmc-config_common");
            // @ts-ignore
            config.common.autoSearch = common.querySelector(".pmc-config_enable").checked;

            const unsplash = dialog.element.querySelector(".pmc-config_unsplash");
            // @ts-ignore
            config.unsplash.enable = unsplash.querySelector(".pmc-config_enable").checked;
            // @ts-ignore
            config.unsplash.accessKey = unsplash.querySelector(".pmc-config_key").value;

            const pixabay = dialog.element.querySelector(".pmc-config_pixabay");
            // @ts-ignore
            config.pixabay.enable = pixabay.querySelector(".pmc-config_enable").checked;
            // @ts-ignore
            config.pixabay.key = pixabay.querySelector(".pmc-config_key").value;

            let allSuccess = true;
            if (config.unsplash.enable && !config.unsplash.accessKey) {
                allSuccess = false;
                showMessage(this.i18n.unsplash.accessKeyNotNull);
            }
            if (config.pixabay.enable && !config.pixabay.key) {
                allSuccess = false;
                showMessage(this.i18n.pixabay.keyNotNull);
            }
            if (!allSuccess) {
                return;
            }
            this.saveData(STORAGE_NAME, config);
            dialog.destroy();
        });
    }

    onLayoutReady() {
        this.loadData(STORAGE_NAME).then(r => {
            if (r == "") {
                this.saveData(STORAGE_NAME, new Configs())
                    .then(() => console.log(`初始化${this.i18n.pluginName}配置完成`));
            }
        });

        console.log(`${this.i18n.pluginName} is loaded`);
        this.eventBus.on("loaded-protyle", event => {
            this.addChangeIconListener(event);
        });
    }

    private getConfig(): Configs {
        return this.data[STORAGE_NAME];
    }

    private changeCover(event: Event, background: Background, dialog: Dialog) {
        const target = event.target as HTMLElement;
        const imageId = target.dataset.imageId;
        const url = target.dataset.downloadUrl;
        let suffix = "png";
        console.log(`${this.i18n.pluginName}: 开始下载图片：`, url);
        fetch(url)
            .then(response => {
                suffix = response.url.substring(response.url.indexOf("fm=") + 3);
                suffix = suffix.substring(0, suffix.indexOf("&"));
                return response.blob();
            })
            .then(blob => {
                // 上传资源文件
                const fileName = `${imageId}.${suffix}`;

                const fd = new FormData();
                fd.append("assetsDirPath", "/assets/");
                fd.append("file[]", blob, fileName);

                console.log(`${this.i18n.pluginName}: 下载图片成功，开始上传到思源`);
                fetchPost("/api/asset/upload", fd, resp => {
                    const succMap = resp.data.succMap;
                    console.log(`${this.i18n.pluginName}: 上传封面成功`, succMap);
                    // 重新设置封面
                    fetchPost("/api/attr/setBlockAttrs", {
                        id: background.ial["id"],
                        attrs: {
                            "title-img": `background-image:url(${succMap[fileName]})`
                        }
                    }, r => {
                        console.log(`${this.i18n.pluginName}: 设置封面成功`, r);
                        // 更新封面
                        background.ial["title-img"] = `background-image:url("${succMap[fileName]}")`;
                        background.imgElement.src = `${succMap[fileName]}`;
                        // 关闭 dialog
                        dialog.destroy();
                    });
                });
            });
    }

    private showDialog(background: Background, enableConfigs: Config[]) {
        const config = this.getConfig();

        console.log(enableConfigs);
        let selectedId = enableConfigs[0].id;
        let selectHtml = "";
        if (enableConfigs.length > 1) {
            selectHtml += "<select class=\"pmc-search-select\">";
            enableConfigs.forEach((c) => {
                if (c.id == config.common.selectedId) {
                    selectedId = c.id;
                }
                selectHtml += `<option value="${c.id}" ${c.id == config.common.selectedId ? "selected" : ""}>${c.name}</option>`;
            });
            selectHtml += "</select>";
        }
        // @ts-ignore
        const selectedName = config[selectedId].name;

        const dialog = new Dialog({
            title: this.i18n.pluginName,
            content: `
<div class="b3-dialog__content" style="background: white; padding: 10px">
    <div class="pmc-search">
        ${selectHtml}
        <div class="pmc-search-focusable-within">
            <input class="pmc-search-input" type="text" autofocus="autofocus" 
                placeholder="${this.i18n.use} ${selectedName} ${this.i18n.searchUnsplashPlaceholder}"/>
        </div>    
        ${config.common.autoSearch ? "" : "<button class=\"pmc-search-btn\">" + this.i18n.search + "</button>"}
    </div>
    <div class="fn__hr"></div>
    <div class="pmc-result"></div>
    <div class="pmc-page"></div>
</div>`,
            width: this.isMobile ? "92vw" : "600px",
            height: "540px",
        });

        // 绑定事件
        const searchInput = dialog.element.querySelector(".pmc-search-input") as HTMLInputElement;
        const searchBtn = dialog.element.querySelector(".pmc-search-btn");
        dialog.element.querySelector(".pmc-search-select")?.addEventListener("change", evt => {
            const target = evt.target as HTMLSelectElement;
            const id = target.options[target.selectedIndex].value;
            // @ts-ignore
            const name = (config[id] as Config).name;
            const placeholder = `${this.i18n.use} ${name} ${this.i18n.searchUnsplashPlaceholder}`;
            searchInput.setAttribute("placeholder", placeholder);
            searchInput.dispatchEvent(new InputEvent("input"));
            searchBtn?.dispatchEvent(new Event("click"));
        });

        if (!config.common.autoSearch) {
            searchBtn.addEventListener("click", () => {
                const searchValue = searchInput.value;
                const pageNum = this.currentPage(dialog);
                this.doSearch(dialog, background, searchValue, pageNum);
            });
        } else {
            let lastTime = 0;
            searchInput.addEventListener("input", evt => {
                const searchValue = (evt.target as HTMLInputElement).value;
                const curTime = new Date().getTime();
                lastTime = curTime;
                // 延时查询：0.5秒后没有输入则进行查询
                setTimeout(() => {
                    if (curTime == lastTime) {
                        const pageNum = this.currentPage(dialog);
                        this.doSearch(dialog, background, searchValue, pageNum);
                    }
                }, 500);
            });
        }

        // 打开对话框时自动查询
        this.doSearch(dialog, background);
    }

    private currentPage(dialog: Dialog) {
        const curPage = dialog.element.querySelector(".pmc-page .pmc-page-cur") as HTMLDivElement;
        return curPage ? parseInt(curPage.innerHTML) : 1;
    }

    private doSearch(dialog: Dialog, background: Background, searchValue?: string, pageNum?: number) {
        if (searchValue) {
            this.search(dialog, background, searchValue, pageNum);
        } else {
            this.random(dialog, background);
        }
    }

    private getActiveConfig(dialog: Dialog): Config {
        const select = dialog.element.querySelector(".pmc-search-select") as HTMLSelectElement;
        if (select) {
            const id = select.options[select.selectedIndex].value;
            const config = this.getConfig();
            // @ts-ignore
            return config[id] as Config;
        }
        return this.getEnableConfigs()[0];
    }

    private getPageApi(config: Config, searchValue: string, pageNum: number): string {
        let api = config.pageApi;
        Object.keys(config).forEach(value => {
            // @ts-ignore
            api = api.replace("{{" + value + "}}", config[value]);
        });
        api = api.replace("{{pageNum}}", String(pageNum))
            .replace("{{searchValue}}", searchValue);
        return api;
    }

    /**
     * 进行搜索
     * @param dialog 对话框
     * @param background 封面相关的数据
     * @param searchValue 搜索关键字
     * @param pageNum
     * @private
     */
    private search(dialog: Dialog, background: Background, searchValue: string, pageNum?: number) {
        // 获取当前配置
        const config = this.getActiveConfig(dialog);
        const url = this.getPageApi(config, searchValue, pageNum);
        console.log(url);
        fetch(url)
            .then(response => response.json())
            .then(rs => {
                let pageInfo;
                switch (config.id) {
                    case "unsplash":
                        pageInfo = this.convertUnsplashResp(rs as UnsplashResp);
                        break;
                    case "pixabay":
                        pageInfo = this.convertPixabayResp(rs as PixabayResp);
                        break;
                    default:
                        throw new Error(`不支持 ${config.id} - ${config.name}`);
                }
                console.log("pageInfo", pageInfo);
                this.showResult(dialog, background, config, pageInfo, pageNum);
            })
            .catch(reason => {
                showMessage(reason, 5000, "error");
                console.log(reason);
            });
    }

    private showResult(dialog: Dialog, background: Background, config: Config, pageInfo: PageInfo, curPage: number) {
        if (pageInfo.errors?.length > 0) {
            showMessage(pageInfo.errors.join("\n"), 5000, "error");
            return;
        }
        if (pageInfo.total <= 0) {
            console.log(`${this.i18n.pluginName}: 找不到图片`);
            return;
        }
        const result = dialog.element.querySelector(".pmc-result");
        result.innerHTML = "";
        pageInfo.items.forEach(value => {
            const div = document.createElement("div");
            div.classList.add("pmc-result-item");
            div.innerHTML = `
<div class="pmc-result-item-img">
    <div style="width: 100%; height: 100%;">
    <img src="${value.thumbUrl}"
            data-image-id="${value.id}"
            data-download-url="${value.downloadUrl}"
            alt="${value.description}"/>
    </div>
</div>
<div class="pmc-result-item-person">
    by <a href="${value.htmlUrl}" title="${value.username}" target="_blank">${value.username}</a>
</div>`;
            div.querySelector("img").addEventListener(this.getEventName(), ev => this.changeCover(ev, background, dialog));
            result.appendChild(div);
        });

        const pageElement = dialog.element.querySelector(".pmc-page") as HTMLDivElement;
        pageElement.innerHTML = "";
        if (pageInfo.total) {
            pageElement.classList.remove("hide");
            // 进行分页
            let pageCount = Math.floor(pageInfo.total / config.pageSize);
            if (pageInfo.total % config.pageSize != 0) {
                pageCount += 1;
            }
            console.log("total=", pageInfo.total, "pageCount=", pageCount);
            // 限制一个展示 10 个按钮
            const pageShow = 10;
            let startPage = Math.max(curPage - Math.floor(pageShow / 2), 1);
            const endPage = Math.min(startPage + pageShow - 1, pageCount);
            if (endPage - startPage < (pageShow - 1)) {
                startPage = Math.max(endPage - pageShow + 1, 1);
            }
            console.log("startPage=", startPage, "endPage=", endPage);

            let padding = document.createElement("div");
            padding.classList.add("pmc-page-padding");
            pageElement.append(padding);

            for (let page = startPage; page <= endPage; page++) {
                const btn = document.createElement("button");
                btn.classList.add("pmc-page-item");
                btn.type = "button";
                btn.value = String(page);
                btn.innerText = String(page);
                if (curPage == page) {
                    btn.classList.add("pmc-page-cur");
                    btn.disabled = true;
                }
                pageElement.append(btn);
                btn.addEventListener("click", evt => {
                    this.clickPageItem(dialog, background, evt);
                });
            }

            padding = document.createElement("div");
            padding.classList.add("pmc-page-padding");
            pageElement.append(padding);

            if (pageCount <= 1) {
                pageElement.classList.add("pmc-page-hide");
            }
        } else {
            pageElement.classList.add("pmc-page-hide");
        }
    }

    private clickPageItem(dialog: Dialog, background: Background, evt: MouseEvent) {
        console.log("click", evt);
        const button = evt.target as HTMLButtonElement;
        const pageNum = parseInt(button.value);
        console.log(pageNum);

        const searchInput = dialog.element.querySelector(".pmc-search-input") as HTMLInputElement;

        this.doSearch(dialog, background, searchInput.value, pageNum);
    }

    private convertUnsplashResp(response: UnsplashResp): PageInfo {
        return {
            total: response.total,
            errors: response.errors,
            items: response.results?.map(value => {
                return {
                    id: value.id,
                    username: value.user.name,
                    thumbUrl: value.urls.thumb,
                    downloadUrl: value.links.download,
                    htmlUrl: value.links.html,
                    description: value.alt_description
                };
            })
        };
    }

    private convertPixabayResp(response: PixabayResp): PageInfo {
        return {
            total: response.total,
            errors: [],
            items: response.hits?.map(value => {
                return {
                    id: String(value.id),
                    username: value.user,
                    thumbUrl: value.previewURL,
                    downloadUrl: value.imageURL || value.largeImageURL,
                    htmlUrl: value.pageURL,
                    description: value.tags
                };
            })
        };
    }

    private random(dialog: Dialog, background: Background) {
        console.log("-------- random ---------", dialog, background);
    }

    private getEnableConfigs(): Config[] {
        const config = this.getConfig();
        const list: Config[] = [];
        Object.keys(config).forEach(value => {
            if (value == "common") {
                return;
            }
            // @ts-ignore
            const item = config[value] as Config;
            if (item.enable) {
                list.push(item);
            }
        });
        return list;
    }

    /**
     * 配置或直接打开对话框
     * @private
     */
    private configOrShowDialog(background: Background) {
        const enableConfigs = this.getEnableConfigs();
        const anyEnable = enableConfigs.length > 0;
        if (anyEnable) {
            // 已有配置文件，直接打开对话框
            this.showDialog(background, enableConfigs);
            return;
        }
        // 打开配置对话框
        showMessage(this.i18n.noEnableConfig);
        this.openSetting();
    }

    private addChangeIconListener(event: CustomEvent) {
        const background = event.detail.background as Background;
        // 获取“随机题头图” 按钮
        const buttons = background.element.querySelectorAll("span[data-type=\"random\"]");
        buttons.forEach((button) => {
            button.addEventListener(this.getEventName(), ev => {
                this.configOrShowDialog(background);
                ev.preventDefault();
                ev.stopPropagation();
            });
        });
    }

    private getEventName = () => {
        if (navigator.userAgent.indexOf("iPhone") > -1) {
            return "touchstart";
        } else {
            return "click";
        }
    };
}
