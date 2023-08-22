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
    applicationName = "";
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
            <label>Application Name:&nbsp;</label>
            <input class="pmc-config-application-name" type="text" value="${config.unsplash.applicationName ?? ""}" style="flex: 1">        
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
            config.common.autoSearch = (common.querySelector(".pmc-config_enable") as HTMLInputElement).checked;

            const unsplash = dialog.element.querySelector(".pmc-config_unsplash");
            config.unsplash.enable = (unsplash.querySelector(".pmc-config_enable") as HTMLInputElement).checked;
            config.unsplash.applicationName = (unsplash.querySelector(".pmc-config-application-name") as HTMLInputElement).value ?? "";
            config.unsplash.accessKey = (unsplash.querySelector(".pmc-config_key") as HTMLInputElement).value;

            const pixabay = dialog.element.querySelector(".pmc-config_pixabay");
            config.pixabay.enable = (pixabay.querySelector(".pmc-config_enable") as HTMLInputElement).checked;
            config.pixabay.key = (pixabay.querySelector(".pmc-config_key") as HTMLInputElement).value;

            let allSuccess = this.validateConfig(config);
            if (!allSuccess) {
                return;
            }
            this.saveData(STORAGE_NAME, config).then(r => console.log("保存配置成功", r));
            dialog.destroy();
        });
    }

    private validateConfig(config: Configs) {
        let allSuccess = true;
        if (config.unsplash.enable && !config.unsplash.applicationName) {
            allSuccess = false;
            showMessage(this.i18n.unsplash.applicationNameNotNull);
        }
        if (config.unsplash.enable && !config.unsplash.accessKey) {
            allSuccess = false;
            showMessage(this.i18n.unsplash.accessKeyNotNull);
        }
        if (config.pixabay.enable && !config.pixabay.key) {
            allSuccess = false;
            showMessage(this.i18n.pixabay.keyNotNull);
        }
        return allSuccess;
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

    private downloadCover(event: Event, background: Background, dialog: Dialog, config: Config) {
        const target = event.target as HTMLElement;
        const imageId = target.dataset.imageId;
        const url = target.dataset.downloadUrl;
        let format = "png";
        console.log(`${this.i18n.pluginName}: 开始下载图片：`, url);
        // 显示遮罩层
        dialog.element.querySelector(".pmc-change-loading").classList.remove("pmc-hide");
        // 设置文字：正在下载题头图，请稍候
        dialog.element.querySelector(".pmc-change-loading-info").innerHTML = `${this.i18n.downloadingCover}`;

        // 需要再次请求
        if (config.id == "unsplash") {
            fetch(url)
                .then(async response => {
                    if (config.id == "unsplash") {
                        const r = await response.json();
                        const v = await fetch(r.url);
                        format = this.convertFormat(config, r.url);
                        return await v.blob();
                    }
                    format = this.convertFormat(config, response.url);
                    return response.blob();
                })
                .then(blob => {
                    this.changeCover(dialog, config, imageId, format, blob, background);
                })
                .catch(reason => {
                    showMessage(reason, 5000, "error");
                    console.log(reason);
                    // 隐藏遮罩层
                    dialog.element.querySelector(".pmc-change-loading").classList.add("pmc-hide");
                });
            return;
        }

        fetch(url)
            .then(response => {
                format = this.convertFormat(config, response.url);
                return response.blob();
            })
            .then(blob => {
                this.changeCover(dialog, config, imageId, format, blob, background);
            })
            .catch(reason => {
                showMessage(reason, 5000, "error");
                console.log(reason);
                // 隐藏遮罩层
                dialog.element.querySelector(".pmc-change-loading").classList.add("pmc-hide");
            });
    }

    private changeCover(dialog: Dialog, config: Config, imageId: string, format: string, blob: Blob, background: Background) {
        // 设置文字：正在上传图片到思源，请稍候
        dialog.element.querySelector(".pmc-change-loading-info").innerHTML = `${this.i18n.uploadingCover}`;
        // 上传资源文件
        const fileName = `${config.id}-${imageId}.${format}`;

        const fd = new FormData();
        fd.append("assetsDirPath", "/assets/");
        fd.append("file[]", blob, fileName);

        console.log(`${this.i18n.pluginName}: 下载图片成功，开始上传到思源`);
        fetchPost("/api/asset/upload", fd, resp => {
            const succMap = resp.data.succMap;
            console.log(`${this.i18n.pluginName}: 上传封面成功`, succMap);
            dialog.element.querySelector(".pmc-change-loading-info").innerHTML = `${this.i18n.settingCover}`;
            // 重新设置封面
            fetchPost("/api/attr/setBlockAttrs", {
                id: background.ial["id"],
                attrs: {
                    "title-img": `background-image:url(${succMap[fileName]})`
                }
            }, r => {
                showMessage(`${this.i18n.pluginName}: ${this.i18n.setCoverSuccess}`);
                console.log(`${this.i18n.pluginName}: 设置封面成功`, r);
                // 更新封面
                background.ial["title-img"] = `background-image:url("${succMap[fileName]}")`;
                background.imgElement.src = `${succMap[fileName]}`;
                const img = background.ial["title-img"];
                background.imgElement.classList.remove("fn__none");
                // @ts-ignore
                background.imgElement.setAttribute("style", window.Lute.UnEscapeHTMLStr(img));
                const position = background.imgElement.style.backgroundPosition || background.imgElement.style.objectPosition;
                const url = background.imgElement.style.backgroundImage?.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
                background.imgElement.removeAttribute("style");
                background.imgElement.setAttribute("src", url);
                background.imgElement.style.objectPosition = position;
                background.element.querySelector('[data-type="position"]').classList.remove("fn__none");
                background.element.style.minHeight = "30vh";

                // 关闭 dialog
                dialog.destroy();
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
        console.log("selectedName", selectedName, "selectHtml", selectHtml);

        const dialog = new Dialog({
            title: this.i18n.pluginName,
            content: `
<div class="pmc-change-loading pmc-hide">
    <div class="pmc-change-loading-icon">
        <div></div>
        <div></div>
        <div></div>
    </div>    
    <div class="pmc-change-loading-info"></div>    
</div>
<div class="b3-dialog__content" style="background: white; padding: 10px; display: flex; flex-direction: column;">
    <div class="pmc-search">
        ${selectHtml}
        <div class="pmc-search-focusable-within">
            <input class="pmc-search-input" type="text" autofocus="autofocus" 
                placeholder="${this.i18n.use} ${selectedName} ${this.i18n.searchUnsplashPlaceholder}"/>
        </div>    
        ${config.common.autoSearch ? "" : "<button class=\"pmc-search-btn\">" + this.i18n.search + "</button>"}
    </div>
    <div class="fn__hr"></div>
    <div class="pmc-rp">
        <div class="pmc-rp-loading pmc-hide">
        </div>
        <div class="pmc-rp-result"></div>
        <div class="pmc-rp-page"></div>
    </div>
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
            config.common.selectedId = id;
            this.saveData(STORAGE_NAME, config).then(r => console.log("保存下拉框成功", r));
            // 切换下拉框后也需要焦点
            searchInput.focus();
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
        // 每次打开都进行焦点
        searchInput.focus();
        // 打开对话框时自动查询
        this.doSearch(dialog, background);
    }

    private currentPage(dialog: Dialog) {
        const curPage = dialog.element.querySelector(".pmc-rp-page .pmc-rp-page-cur") as HTMLDivElement;
        return curPage ? parseInt(curPage.innerHTML) : 1;
    }

    private doSearch(dialog: Dialog, background: Background, searchValue?: string, pageNum?: number) {
        // 清空结果
        dialog.element.querySelector(".pmc-rp-result").innerHTML = "";
        dialog.element.querySelector(".pmc-rp-page").innerHTML = "";
        // 显示遮罩层
        const mark = dialog.element.querySelector(".pmc-rp-loading") as HTMLDivElement;
        mark.classList.remove("pmc-hide");
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
                const pageInfo = this.convertResp(config, rs);
                console.log("pageInfo", pageInfo);
                this.showResult(dialog, background, config, pageInfo, pageNum);
                // 隐藏遮罩层
                const mark = dialog.element.querySelector(".pmc-rp-loading") as HTMLDivElement;
                mark.classList.add("pmc-hide");
            })
            .catch(reason => {
                showMessage(reason, 5000, "error");
                console.log(reason);
                // 隐藏遮罩层
                const mark = dialog.element.querySelector(".pmc-rp-loading") as HTMLDivElement;
                mark.classList.add("pmc-hide");
            });
    }

    /**
     * 转换分页对象，新增配置时需要调整这里
     * @private
     */
    private convertResp(config: Config, rs: any) {
        switch (config.id) {
            case "unsplash":
                return this.convertUnsplashResp(rs as UnsplashResp, config as UnsplashConfig);
            case "pixabay":
                return this.convertPixabayResp(rs as PixabayResp);
            default:
                throw new Error(`不支持 ${config.id} - ${config.name}`);
        }
    }

    /**
     * 获取文件扩展名，新增配置时需要调整这里
     * @private
     */
    private convertFormat(config: Config, url: string): string {
        switch (config.id) {
            case "unsplash": {
                const format = url.substring(url.indexOf("fm=") + 3);
                return format.substring(0, format.indexOf("&"));
            }
            case "pixabay":
            default: {
                return url.substring(url.lastIndexOf(".") + 1);
            }
        }

    }

    private showResult(dialog: Dialog, background: Background, config: Config, pageInfo: PageInfo, curPage: number) {
        if (pageInfo.errors?.length > 0) {
            showMessage(pageInfo.errors.join("\n"), 5000, "error");
            return;
        }
        const result = dialog.element.querySelector(".pmc-rp-result");
        if (pageInfo.total <= 0) {
            console.log(`${this.i18n.pluginName}: 找不到图片`);
            result.innerHTML = `<p style="margin: auto">${this.i18n.noResultsFound}</p>`;
            return;
        }
        result.innerHTML = "";
        pageInfo.items.forEach(value => {
            const div = document.createElement("div");
            div.classList.add("pmc-rp-result-item");
            div.innerHTML = `
<div class="pmc-rp-result-item-img">
    <div style="width: 100%; height: 100%;">
    <img src="${value.thumbUrl}"
            data-image-id="${value.id}"
            data-download-url="${value.downloadUrl}"
            alt="${value.description}"/>
    </div>
</div>
<div class="pmc-rp-result-item-person">
    by <a href="${value.htmlUrl}" title="${value.username}" target="_blank">${value.username}</a>
</div>`;
            div.querySelector("img").addEventListener(this.getEventName(),
                ev => this.downloadCover(ev, background, dialog, config));
            result.appendChild(div);
        });

        const pageElement = dialog.element.querySelector(".pmc-rp-page") as HTMLDivElement;
        pageElement.innerHTML = "";
        if (pageInfo.total) {
            pageElement.classList.remove("pmc-hide");
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
            padding.classList.add("pmc-rp-page-padding");
            pageElement.append(padding);

            for (let page = startPage; page <= endPage; page++) {
                const btn = document.createElement("button");
                btn.classList.add("pmc-rp-page-item");
                btn.type = "button";
                btn.value = String(page);
                btn.innerText = String(page);
                if (curPage == page) {
                    btn.classList.add("pmc-rp-page-cur");
                    btn.disabled = true;
                }
                pageElement.append(btn);
                btn.addEventListener("click", evt => {
                    this.clickPageItem(dialog, background, evt);
                });
            }

            padding = document.createElement("div");
            padding.classList.add("pmc-rp-page-padding");
            pageElement.append(padding);

            if (pageCount <= 1) {
                pageElement.classList.add("pmc-hide");
            } else {
                pageElement.classList.remove("pmc-hide");
            }
        } else {
            pageElement.classList.add("pmc-hide");
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

    private convertUnsplashResp(response: UnsplashResp, config: UnsplashConfig): PageInfo {
        return {
            total: response.total,
            errors: response.errors,
            items: response.results?.map(value => {
                return {
                    id: value.id,
                    username: value.user.name,
                    thumbUrl: `${value.urls.thumb}&utm_source=${config.applicationName}&utm_medium=referral`,
                    downloadUrl: `${value.links.download_location}&client_id=${config.accessKey}`,
                    htmlUrl: `${value.user.links.html}?utm_source=${config.applicationName}&utm_medium=referral`,
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
        // 隐藏遮罩层
        const mark = dialog.element.querySelector(".pmc-rp-loading") as HTMLDivElement;
        mark.classList.add("pmc-hide");
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
        if (!this.validateConfig(this.getConfig())) {
            this.openSetting();
            return;
        }
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
