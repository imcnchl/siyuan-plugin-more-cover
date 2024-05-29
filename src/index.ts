import {Dialog, fetchPost, getFrontend, IObject, IProtyle, Plugin, showMessage} from "siyuan";
import "./index.scss";
import {UnsplashConfig} from "./covers/UnsplashProvider";
import {PixabayConfig} from "./covers/PixabayProvider";
import {Cover, CoverProvider, CoverProviderConfig, PageResult} from "./covers/CoverProvider";
import {covers} from "./covers/CoverRegister";

interface Background {
    element: HTMLElement;
    ial: IObject;
    imgElement: HTMLImageElement;
    iconElement: HTMLElement;
    tagsElement: HTMLElement;
    transparentData: string;

    render(ial: IObject, rootId: string): void;
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
    private pixabayLanguages = {
        "zh": `${this.i18n.languages.zh}`,
        "en": `${this.i18n.languages.en}`
    };
    private providers: Map<string, CoverProvider<any>> = new Map();
    private storage_name = "more-cover-config";

    onload() {
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
            class="pmc-config-enable pmc-switch b3-switch fn__flex-center"/>      
        </div>
    </fieldset>
    <fieldset class="pmc-config_unsplash">
        <legend>&nbsp;${config.unsplash.name}&nbsp;</legend>
        <div class="pmc-config_line">
            <label>${this.i18n.enable}:&nbsp;</label>
            <input type="checkbox" ${config.unsplash.enable ? "checked" : ""} 
                class="pmc-config-enable pmc-switch b3-switch fn__flex-center"/>      
        </div>
        <div class="pmc-config_line">
            <label>Application Name:&nbsp;</label>
            <input class="pmc-config-application-name" type="text" value="${config.unsplash.applicationName ?? ""}" style="flex: 1">        
        </div>
        <div class="pmc-config_line">
            <label>Access Key:&nbsp;</label>
            <input class="pmc-config-key" type="text" value="${config.unsplash.accessKey}" style="flex: 1">        
        </div>
    </fieldset>
    <fieldset class="pmc-config-pixabay">
        <legend>&nbsp;${config.pixabay.name}&nbsp;</legend>
        <div class="pmc-config_line">
            <label>${this.i18n.enable}:&nbsp;</label>
            <input type="checkbox" ${config.pixabay.enable ? "checked" : ""} 
                class="pmc-config-enable pmc-switch b3-switch fn__flex-center"/>      
        </div>
        <div class="pmc-config_line">
            <label>Key:&nbsp;</label><input class="pmc-config-key" type="text" value="${config.pixabay.key}" style="flex: 1">        
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

        const buttons = dialog.element.querySelectorAll(".b3-button");
        buttons[0].addEventListener("click", () => {
            dialog.destroy();
        });
        buttons[1].addEventListener("click", () => {
            const common = dialog.element.querySelector(".pmc-config_common");
            config.common.autoSearch = (common.querySelector(".pmc-config-enable") as HTMLInputElement).checked;

            const unsplash = dialog.element.querySelector(".pmc-config_unsplash");
            config.unsplash.enable = (unsplash.querySelector(".pmc-config-enable") as HTMLInputElement).checked;
            config.unsplash.applicationName = (unsplash.querySelector(".pmc-config-application-name") as HTMLInputElement).value ?? "";
            config.unsplash.accessKey = (unsplash.querySelector(".pmc-config-key") as HTMLInputElement).value;

            const pixabay = dialog.element.querySelector(".pmc-config-pixabay");
            config.pixabay.enable = (pixabay.querySelector(".pmc-config-enable") as HTMLInputElement).checked;
            config.pixabay.key = (pixabay.querySelector(".pmc-config-key") as HTMLInputElement).value;

            const [allSuccess, msg] = this.validateConfig(config);
            if (!allSuccess) {
                showMessage(msg);
                return;
            }
            this.saveData(this.storage_name, config).then(r => console.log("保存配置成功", r));
            dialog.destroy();
        });
    }

    onLayoutReady() {
        this.loadData(this.storage_name).then(r => {
            console.log(`loadData ${this.i18n.pluginName}`, r);
            if (r == "") {
                this.saveData(this.storage_name, new Configs())
                    .then(() => console.log(`初始化${this.i18n.pluginName}配置完成`));
            }
        });

        console.log(`${this.i18n.pluginName} is loaded`);
        this.eventBus.on("loaded-protyle-static", event => {
            this.addChangeIconListener(event);
        });
    }

    private convertToInstance<T>(classType: new (...args: any[]) => T) {
        return function (object: any) {
            return new classType(object);
        };
    }

    private getConfig(): Configs {
        const value = this.data[this.storage_name] as Configs;
        console.log("-----------------------START");
        console.log(value);
        console.log(typeof value.unsplash);
        console.log(typeof new Configs().unsplash);


        
        console.log("-----------------------END");
        return value || new Configs();
    }

    private downloadCover(event: Event, protyle: IProtyle, dialog: Dialog, provider: CoverProvider<any>) {
        const target = event.target as HTMLElement;
        const url = target.dataset.downloadUrl;
        console.log(`${this.i18n.pluginName}: 开始下载图片：`, url);
        this.showLoading(dialog, this.i18n.downloadingCover, false);

        provider.downloadCover(event).then(cover => {
            console.log("cover", cover);
            this.changeCover(dialog, provider, cover, protyle);
        }).catch(reason => {
            showMessage(reason, 5000, "error");
            console.log(reason);
            // 隐藏遮罩层
            this.hideLoading(dialog, false);
        });
    }

    private changeCover(dialog: Dialog, provider: CoverProvider<any>, cover: Cover, protyle: IProtyle) {
        const background = protyle.background;
        // 设置文字：正在上传图片到思源，请稍候
        this.showLoading(dialog, this.i18n.uploadingCover, false);
        // 上传资源文件
        const fileName = `${provider.config.id}-${cover.id}.${cover.format}`;

        const fd = new FormData();
        fd.append("assetsDirPath", "/assets/");
        fd.append("file[]", cover.blob, fileName);

        console.log(`${this.i18n.pluginName}: 下载图片成功，开始上传到思源`);
        fetchPost("/api/asset/upload", fd, resp => {
            const succMap = resp.data.succMap;
            console.log(`${this.i18n.pluginName}: 上传封面成功`, succMap);
            this.showLoading(dialog, this.i18n.settingCover, false);
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
                // @ts-ignore
                background.render(background.ial, protyle.block.rootID);

                // 关闭 dialog
                dialog.destroy();
            });
        });
    }

    private showDialog(protyle: IProtyle) {
        const config = this.getConfig();

        let selectedId = this.providers.keys().next().value as string;
        let selectConfigHtml = "";
        if (this.providers.size > 1) {
            selectConfigHtml += "<select class=\"pmc-search-select\">";
            this.providers.forEach(provider => {
                if (provider.config.id == config.common.selectedId) {
                    selectedId = provider.config.id;
                }
                selectConfigHtml += `<option value="${provider.config.id}" ${provider.config.id == config.common.selectedId ? "selected" : ""}>${provider.config.name}</option>`;
            });
            selectConfigHtml += "</select>";
        }

        let pixabayLanguageHtml = "<select class=\"pmc-search-pixabay-language-select\">";
        for (const code in this.pixabayLanguages) {
            // @ts-ignore
            const name = this.pixabayLanguages[code];
            pixabayLanguageHtml += `<option value="${code}" ${code == config.pixabay.language ? "selected" : ""}>${name}</option>`;
        }
        pixabayLanguageHtml += "</select>";

        // @ts-ignore
        const selectedName = config[selectedId].name;
        console.log("selectedName", selectedName, "selectHtml", selectConfigHtml);

        const dialog = new Dialog({
            title: this.i18n.pluginName,
            content: `
<div id="pmc-change-loading" class="pmc-loading pmc-hide">
    <div class="pmc-loading-icon">
        <div></div>
        <div></div>
        <div></div>
    </div>    
    <div class="pmc-loading-info"></div>    
</div>
<div class="b3-dialog__content" style="background: var(--b3-theme-background); padding: 10px; display: flex; flex-direction: column;">
    <div class="pmc-search">
        ${selectConfigHtml}
        ${pixabayLanguageHtml}
        <div class="pmc-search-focusable-within">
            <input class="pmc-search-input" type="text" autofocus="autofocus" 
                placeholder="${this.i18n.use} ${selectedName} ${this.i18n.searchPlaceholder}"/>
        </div>    
        ${config.common.autoSearch ? "" : "<button class=\"pmc-search-btn\">" + this.i18n.search + "</button>"}
    </div>
    <div class="fn__hr"></div>
    <div class="pmc-rp">
        <div id="pmc-search-loading" class="pmc-loading pmc-hide">
            <div class="pmc-loading-icon">
                <div></div>
                <div></div>
                <div></div>
            </div>    
            <div class="pmc-loading-info"></div>    
        </div>
        <div class="pmc-rp-result"></div>
        <div class="pmc-rp-page"></div>
    </div>
</div>`,
            width: this.isMobile ? "92vw" : "600px",
            height: "540px",
        });
        const body = dialog.element.querySelector(".b3-dialog__body") as HTMLDivElement;
        // @ts-ignore
        body.style = "position: relative;";

        // 绑定事件
        const searchInput = dialog.element.querySelector(".pmc-search-input") as HTMLInputElement;
        const searchBtn = dialog.element.querySelector(".pmc-search-btn");
        const pixabayLanguageSelect = dialog.element.querySelector(".pmc-search-pixabay-language-select") as HTMLSelectElement;
        dialog.element.querySelector(".pmc-search-select")?.addEventListener("change", evt => {
            const target = evt.target as HTMLSelectElement;
            const id = target.options[target.selectedIndex].value;
            // @ts-ignore
            const name = (config[id] as Config).name;
            const placeholder = `${this.i18n.use} ${name} ${this.i18n.searchPlaceholder}`;
            searchInput.setAttribute("placeholder", placeholder);
            searchInput.dispatchEvent(new InputEvent("input"));
            searchBtn?.dispatchEvent(new Event("click"));
            config.common.selectedId = id;
            this.saveData(this.storage_name, config).then(r => console.log("保存下拉框成功", r));
            if (id != "pixabay") {
                pixabayLanguageSelect?.classList.add("pmc-hide");
            } else {
                pixabayLanguageSelect?.classList.remove("pmc-hide");
            }
            // 切换下拉框后也需要焦点
            searchInput.focus();
        });
        if (selectedId != "pixabay") {
            pixabayLanguageSelect?.classList.add("pmc-hide");
        }
        pixabayLanguageSelect?.addEventListener("change", evt => {
            const target = evt.target as HTMLSelectElement;
            const id = target.options[target.selectedIndex].value;
            searchInput.dispatchEvent(new InputEvent("input"));
            searchBtn?.dispatchEvent(new Event("click"));
            config.pixabay.language = id;
            this.saveData(this.storage_name, config).then(r => console.log("保存下拉框成功", r));
            // 切换下拉框后也需要焦点
            searchInput.focus();
        });

        if (!config.common.autoSearch) {
            searchBtn.addEventListener("click", () => {
                const searchValue = searchInput.value;
                this.doSearch(dialog, protyle, searchValue, 1);
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
                        this.doSearch(dialog, protyle, searchValue, 1);
                    }
                }, 500);
            });
        }
        // 每次打开都进行焦点
        searchInput.focus();
        // 打开对话框时自动查询
        this.doSearch(dialog, protyle);
    }

    private doSearch(dialog: Dialog, protyle: IProtyle, searchValue?: string, pageNum?: number) {
        // 清空结果
        dialog.element.querySelector(".pmc-rp-result").innerHTML = "";
        dialog.element.querySelector(".pmc-rp-page").innerHTML = "";
        // 显示遮罩层
        this.showLoading(dialog, this.i18n.searching, true);
        if (searchValue) {
            this.search(dialog, protyle, searchValue, pageNum);
        } else {
            this.random(dialog);
        }
    }

    private getActiveProvider(dialog: Dialog): CoverProvider<any> {
        const select = dialog.element.querySelector(".pmc-search-select") as HTMLSelectElement;
        if (select) {
            const id = select.options[select.selectedIndex].value;
            return this.providers.get(id);
        }
        this.reloadEnabledProviders();
        return this.providers.values().next().value;
    }

    /**
     * 进行搜索
     * @param dialog 对话框
     * @param protyle protyle
     * @param searchValue 搜索关键字
     * @param pageNum
     * @private
     */
    private search(dialog: Dialog, protyle: IProtyle, searchValue: string, pageNum?: number) {
        // 获取当前配置
        const provider = this.getActiveProvider(dialog);
        provider.searchCovers(searchValue, pageNum).then(pageInfo => {
            console.log("pageInfo", pageInfo);
            this.showResult(dialog, protyle, provider, pageInfo);
            // 隐藏遮罩层
            this.hideLoading(dialog, true);
        }).catch(reason => {
            showMessage(reason, 5000, "error");
            console.log(reason);
            // 隐藏遮罩层
            this.hideLoading(dialog, true);
        });
    }

    private showResult(dialog: Dialog, protyle: IProtyle, provider: CoverProvider<any>, pageInfo: PageResult) {
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
                ev => {
                    this.downloadCover(ev, protyle, dialog, provider);
                });
            result.appendChild(div);
        });

        const pageElement = dialog.element.querySelector(".pmc-rp-page") as HTMLDivElement;
        pageElement.innerHTML = "";
        if (pageInfo.total) {
            pageElement.classList.remove("pmc-hide");
            // 进行分页
            const pageCount = pageInfo.totalPageCount();
            console.log("total=", pageInfo.total, "pageCount=", pageCount);
            // 限制一个分页列表只展示 10 个按钮
            const pageShow = 10;
            let startPage = Math.max(pageInfo.pageNum - Math.floor(pageShow / 2), 1);
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
                btn.classList.add("b3-button");
                btn.classList.add("b3-button--outline");
                btn.type = "button";
                btn.value = String(page);
                btn.innerText = String(page);

                pageElement.append(btn);
                if (page < endPage) {
                    const space = document.createElement("div");
                    space.classList.add("fn__space");
                    pageElement.append(space);
                }
                if (pageInfo.pageNum == page) {
                    btn.classList.remove("b3-button--outline");
                    btn.classList.add("pmc-rp-page-cur");
                } else {
                    btn.addEventListener("click", evt => {
                        this.clickPageItem(dialog, protyle, evt);
                    });
                }
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

    private clickPageItem(dialog: Dialog, protyle: IProtyle, evt: MouseEvent) {
        console.log("click", evt);
        const button = evt.target as HTMLButtonElement;
        const pageNum = parseInt(button.value);
        console.log(pageNum);

        const searchInput = dialog.element.querySelector(".pmc-search-input") as HTMLInputElement;

        this.doSearch(dialog, protyle, searchInput.value, pageNum);
    }

    private random(dialog: Dialog) {
        // 隐藏遮罩层
        this.hideLoading(dialog, true);
    }

    private showLoading(dialog: Dialog, msg: string, isSearch: boolean) {
        const selectors = isSearch ? "#pmc-search-loading" : "#pmc-change-loading";
        // const height =showHeader ?  "496px";

        const loading = dialog.element.querySelector(selectors) as HTMLDivElement;
        // loading.style.height = height;
        // 显示遮罩层
        loading.classList.remove("pmc-hide");
        // 设置文字
        loading.querySelector(".pmc-loading-info").innerHTML = msg;
    }

    private hideLoading(dialog: Dialog, isSearch: boolean) {
        const selectors = isSearch ? "#pmc-search-loading" : "#pmc-change-loading";
        // 因此遮罩层
        const loading = dialog.element.querySelector(selectors);
        loading.classList.add("pmc-hide");
        // 移除文字
        loading.querySelector(".pmc-loading-info").innerHTML = "";
    }

    private isCoverConfig(obj: object): boolean {
        if (obj instanceof CoverProviderConfig) {
            return true;
        }
        let count = 0;
        Object.keys(obj).forEach(key => {
            if (key == "id" || key == "name" || key == "enable") {
                count++;
            }
        });
        return count == 3;
    }

    private reloadEnabledProviders() {
        this.providers.clear();

        const map = new Map<string, CoverProvider<any>>(covers.map(cover => [cover.config.id, cover]));

        const config = this.getConfig();
        console.log("reloadEnabledProviders config", config);
        Object.keys(config).forEach(value => {
            // @ts-ignore
            const item = config[value];

            if (!this.isCoverConfig(item)) {
                return;
            }
            if (item.enable) {
                const provider = map.get(item.id);
                provider.config = item;
                this.providers.set(provider.config.id, provider);
            }
        });

        console.log("reload enabled providers", this.providers);
    }

    private validateConfig(config: Configs): readonly [boolean, string] {
        let allSuccess = true;
        const allMsg: string[] = [];

        Object.keys(config).forEach(value => {
            // @ts-ignore
            const item = config[value];
            if (!this.isCoverConfig(item)) {
                return;
            }
            const [success, msg] = item.validate(this.i18n);
            allSuccess = allSuccess && success;
            if (!success) {
                allMsg.push(msg);
            }
        });

        return [allSuccess, allMsg.join("\n")];
    }

    private anyConfigEnable(config: Configs): boolean {
        let anyEnable = false;
        Object.keys(config).forEach(value => {
            // @ts-ignore
            const item = config[value];
            if (!this.isCoverConfig(item)) {
                return;
            }
            const [success] = item.validate(this.i18n);
            console.log(item.id, success);
            anyEnable = anyEnable || success;
        });
        return anyEnable;
    }

    /**
     * 配置或直接打开对话框
     * @private
     */
    private configOrShowDialog(protyle: IProtyle) {
        const config = this.getConfig();
        console.log("this.anyConfigEnable(config)", config, this.anyConfigEnable(config));
        if (!this.anyConfigEnable(config)) {
            this.openSetting();
            return;
        }
        const anyEnable = this.providers.size > 0;
        if (anyEnable) {
            // 已有配置文件，直接打开对话框
            this.showDialog(protyle);
            return;
        }
        // 打开配置对话框
        showMessage(this.i18n.noEnableConfig);
        this.openSetting();
    }

    private addChangeIconListener(event: CustomEvent) {
        const protyle = event.detail.protyle;
        const background = protyle.background as Background;
        const showBtn = background.element.querySelectorAll("[data-type=\"show-random\"]")[0];
        showBtn.setAttribute("aria-label", "随机题头图");
        // 获取“随机题头图” 按钮
        const buttons = background.element.querySelectorAll("[data-type=\"random\"],[data-type=\"show-random\"]");
        buttons.forEach((button) => {
            button.addEventListener(this.getEventName(), ev => {
                this.configOrShowDialog(protyle);
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
