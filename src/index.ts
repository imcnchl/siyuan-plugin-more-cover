import {Dialog, fetchPost, getFrontend, IObject, IPosition, IProtyle, ISiyuan, Plugin, showMessage} from "siyuan";
import "./index.scss";
import {UnsplashConfig} from "./covers/UnsplashProvider";
import {PixabayConfig} from "./covers/PixabayProvider";
import {BindHtmlEvent, Cover, CoverProvider, CoverProviderConfig, PageResult} from "./covers/CoverProvider";
import {coverProviders} from "./covers/CoverProviderRegister";
import {getRandomEmoji, IEmoji, updateFileTreeEmoji} from "./util/emoji";

export interface Siyuan extends ISiyuan {
    emojis?: IEmoji[],
    layout?: {
        layout?: { data: { [key: string]: any } },
        centerLayout?: { data: { [key: string]: any } },
        leftDock?: { data: { [key: string]: any } },
        rightDock?: { data: { [key: string]: any } },
        bottomDock?: { data: { [key: string]: any } },
    }
}

interface Background {
    element: HTMLElement;
    ial: IObject;
    imgElement: HTMLImageElement;
    iconElement: HTMLElement;
    tagsElement: HTMLElement;
    transparentData: string;

    render(ial: IObject, rootId: string): void;

    updateFileTreeEmoji(unicode: string, id: string, icon?: string): void;

    updateOutlineEmoji(unicode: string, id: string): void;

    openEmojiPanel(id: string, type: "doc" | "notebook" | "av", position: IPosition, avCB?: (emoji: string) => void): void
}

/**
 * 各个图库的配置的字段名必须和 config.id 一致
 */
class Configs {
    common = {
        autoSearch: false,
        selectedId: "",
        /**
         * 自动添加封面
         */
        autoAddCoverIfAbsent: true,
        /**
         * 自动添加图标
         */
        autoAddIconIfAbsent: true,
    };
    unsplash: UnsplashConfig = new UnsplashConfig();
    pixabay: PixabayConfig = new PixabayConfig();
}

export default class MoreCoverPlugin extends Plugin {

    private isMobile: boolean;
    configs: Configs;
    private providers: Map<string, CoverProvider<CoverProviderConfig>> = new Map();
    storage_name = "more-cover-config";

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

        const bindEventMap = new Map<CoverProvider<any>, any>();
        const saveSettingMap = new Map<CoverProvider<any>, any>();
        let coversConfigHtml = "";
        coverProviders.forEach(provider => {
            const settingPromise = new Promise<HTMLElement>(resolve => {
                saveSettingMap.set(provider, resolve);
            });
            const html = provider.makeSettingHtml(this.i18n, settingPromise, new Promise<BindHtmlEvent>(resolve => {
                bindEventMap.set(provider, resolve);
            }));

            let count = saveSettingMap.size;
            settingPromise.then(() => {
                console.log(`重写插件中 ${provider.config.id} 的配置信息`, provider.config);
                // 重新写入到 configs 中
                // @ts-ignore
                this.configs[provider.config.id] = provider.config;
            }).then(() => {
                count = count - 1;
                if (count <= 0) {
                    console.log("all provider config changed, do save");
                    const [allSuccess, msg] = this.validateConfig();
                    console.log("validateConfig", allSuccess, msg);
                    if (!allSuccess) {
                        showMessage(msg);
                        return;
                    }
                    this.saveData(this.storage_name, this.configs).then(r => console.log("保存配置成功", this.configs));
                    this.reloadAll();
                    dialog.destroy();
                }
            });
            coversConfigHtml += html + "\n";
        });

        const dialog = new Dialog({
            title: `${this.displayName}${this.i18n.config}`,
            content: `
<div class="b3-dialog__content">
<div class="pmc-config">
    <fieldset class="pmc-config_common">
        <legend>&nbsp;${this.i18n.common}&nbsp;</legend>
        <div class="pmc-config_line">
            <label>${this.i18n.autoSearch}:&nbsp;</label>
            <input type="checkbox" ${this.configs.common.autoSearch ? "checked" : ""} 
            class="pmc-config-enable pmc-switch b3-switch fn__flex-center pmc-config-autoSearch"/>      
        </div>
        <div class="pmc-config_line">
            <label>${this.i18n.autoAddCoverIfAbsent}:&nbsp;</label>
            <input type="checkbox" ${this.configs.common.autoAddCoverIfAbsent ? "checked" : ""} 
            class="pmc-config-enable pmc-switch b3-switch fn__flex-center pmc-config-autoAddCoverIfAbsent"/>      
        </div>
        <div class="pmc-config_line">
            <label>${this.i18n.autoAddIconIfAbsent}:&nbsp;</label>
            <input type="checkbox" ${this.configs.common.autoAddIconIfAbsent ? "checked" : ""} 
            class="pmc-config-enable pmc-switch b3-switch fn__flex-center pmc-config-autoAddIconIfAbsent"/>      
        </div>
    </fieldset>
    ${coversConfigHtml}
</div>
</div>
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
            this.configs.common.autoSearch = (common.querySelector(".pmc-config-autoSearch") as HTMLInputElement).checked;
            this.configs.common.autoAddCoverIfAbsent = (common.querySelector(".pmc-config-autoAddCoverIfAbsent") as HTMLInputElement).checked;
            this.configs.common.autoAddIconIfAbsent = (common.querySelector(".pmc-config-autoAddIconIfAbsent") as HTMLInputElement).checked;

            // 触发事件
            saveSettingMap.forEach((resolve, provider) => {
                const target = provider.getSettingHtml(dialog);
                resolve(target);
            });
        });
        // 触发事件
        bindEventMap.forEach((resolve, provider) => {
            const target = provider.getSettingHtml(dialog);
            resolve({
                plugin: this,
                dialog: dialog,
                target: target
            });
        });
    }

    onLayoutReady() {
        this.loadData(this.storage_name).then(r => {
            this.reloadAll();
            if (r == "") {
                this.saveData(this.storage_name, new Configs())
                    .then(() => console.log(`初始化${this.i18n.pluginName}配置完成`));
            }
        });

        console.log(`${this.i18n.pluginName} is loaded`);
        this.eventBus.on("loaded-protyle-static", event => {
            this.addChangeIconListener(event);
            this.autoAddCoverIfAbsent(event);
            this.autoAddIconIfAbsent(event);
        });
    }

    private reloadAll() {
        this.reloadConfigs();
        this.reloadEnabledProviders();
    }

    private reloadConfigs() {
        this.configs = this.data[this.storage_name] as Configs;
        if (!this.configs) {
            this.configs = new Configs();
            return;
        }

        // JSON 转对象时属性的方法丢失，需要把方法重新赋值上
        const map = new Map<string, CoverProvider<any>>(coverProviders.map(cover => [cover.config.id, cover]));
        Object.keys(this.configs).forEach(value => {
            // @ts-ignore
            const item = this.configs[value] as CoverProviderConfig;
            if (!this.isCoverConfig(item)) {
                return;
            }
            const providerConfig = map.get(item.id).config;
            Object.assign(providerConfig, item);
            // @ts-ignore
            this.configs[value] = providerConfig;
        });

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
                dialog?.destroy();
            });
        });
    }

    private showDialog(protyle: IProtyle) {
        let selectedId = this.providers.keys().next().value as string;
        let selectConfigHtml = "";
        if (this.providers.size > 1) {
            selectConfigHtml += "<select class=\"pmc-search-select\">";
            this.providers.forEach(provider => {
                if (provider.config.id == this.configs.common.selectedId) {
                    selectedId = provider.config.id;
                }
                selectConfigHtml += `<option value="${provider.config.id}" ${provider.config.id == this.configs.common.selectedId ? "selected" : ""}>${provider.config.name}</option>`;
            });
            selectConfigHtml += "</select>";
        }

        const bindEventMap = new Map<CoverProvider<any>, any>();
        let afterChangeCoverProviderHtml = "";
        this.providers.forEach(provider => {
            const html = provider.makeAfterSelectHtml(this.i18n, new Promise<BindHtmlEvent>(resolve => {
                bindEventMap.set(provider, resolve);
            }));
            afterChangeCoverProviderHtml += html;
        });

        // @ts-ignore
        const selectedName = this.configs[selectedId].name;

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
        ${afterChangeCoverProviderHtml}
        <div class="pmc-search-focusable-within">
            <input class="pmc-search-input" type="text" autofocus="autofocus" 
                placeholder="${this.i18n.use} ${selectedName} ${this.i18n.searchPlaceholder}"/>
        </div>    
        ${this.configs.common.autoSearch ? "" : "<button class=\"pmc-search-btn\">" + this.i18n.search + "</button>"}
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
        const searchBtn = dialog.element.querySelector(".pmc-search-btn") as HTMLButtonElement;
        dialog.element.querySelector(".pmc-search-select")?.addEventListener("change", evt => {
            const target = evt.target as HTMLSelectElement;
            const id = target.options[target.selectedIndex].value;
            // @ts-ignore
            const name = (this.configs[id] as Config).name;
            const placeholder = `${this.i18n.use} ${name} ${this.i18n.searchPlaceholder}`;
            searchInput.setAttribute("placeholder", placeholder);
            searchInput.dispatchEvent(new InputEvent("input"));
            searchBtn?.dispatchEvent(new Event("click"));
            this.configs.common.selectedId = id;
            this.saveData(this.storage_name, this.configs).then(r => console.log("保存下拉框成功", r));
            // 隐藏其他图库的html
            this.hideOtherProviderHtml(dialog);
            // 切换下拉框后也需要焦点
            searchInput.focus();
        });

        // 隐藏其他图库的html
        this.hideOtherProviderHtml(dialog);
        // 触发事件
        bindEventMap.forEach((resolve, provider) => {
            const target = provider.getAfterSelectHtml(dialog);
            const bindHtmlEvent: BindHtmlEvent = {
                plugin: this,
                dialog: dialog,
                target: target,
                searchInput: searchInput,
                searchBtn: searchBtn
            };
            resolve(bindHtmlEvent);
        });

        if (!this.configs.common.autoSearch) {
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
        this.doSearch(dialog, protyle, "", 1);
    }

    private hideOtherProviderHtml(dialog: Dialog) {
        this.providers.forEach(provider => {
            const html = provider.getAfterSelectHtml(dialog);
            if (provider.config.id !== this.configs.common.selectedId) {
                // 不是当前选中，需要隐藏掉
                html?.classList.add("pmc-hide");
            } else {
                // 当前选中
                html?.classList.remove("pmc-hide");
            }
        });
    }

    private doSearch(dialog: Dialog, protyle: IProtyle, searchValue?: string, pageNum?: number) {
        // 清空结果
        dialog.element.querySelector(".pmc-rp-result").innerHTML = "";
        dialog.element.querySelector(".pmc-rp-page").innerHTML = "";

        if (searchValue) {
            this.search(dialog, protyle, searchValue, pageNum);
        } else {
            this.random(dialog, protyle, pageNum);
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
        // 显示遮罩层
        this.showLoading(dialog, this.i18n.searching, true);
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

    private random(dialog: Dialog, protyle: IProtyle, pageNum: number) {
        // 获取当前配置
        const provider = this.getActiveProvider(dialog);
        if (!provider.config.randomEnable) {
            return;
        }
        // 显示遮罩层
        this.showLoading(dialog, this.i18n.searching, true);
        provider.randomCovers(pageNum).then(pageInfo => {
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

    private showLoading(dialog: Dialog, msg: string, isSearch: boolean) {
        if (!dialog) {
            return;
        }
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

    private reloadEnabledProviders() {
        this.providers.clear();

        const map = new Map<string, CoverProvider<any>>(coverProviders.map(cover => [cover.config.id, cover]));

        Object.keys(this.configs).forEach(value => {
            // @ts-ignore
            const item = this.configs[value];

            if (!this.isCoverConfig(item)) {
                return;
            }
            if (item.enable) {
                const provider = map.get(item.id);
                provider.config = item;
                this.providers.set(provider.config.id, provider);
            }
        });
    }

    private validateConfig(): readonly [boolean, string] {
        let allSuccess = true;
        const allMsg: string[] = [];

        Object.keys(this.configs).forEach(value => {
            // @ts-ignore
            const item = this.configs[value] as CoverProviderConfig;
            if (!this.isCoverConfig(item)) {
                return;
            }
            if (!item.enable) {
                return;
            }
            const [success, msg] = item.validate(this.i18n);
            console.log(`${value} validate success is ${success}, msg is ${msg}`);
            allSuccess = allSuccess && success;
            if (!success) {
                allMsg.push(msg);
            }
        });

        return [allSuccess, allMsg.join("\n")];
    }

    private isCoverConfig(obj: any): boolean {
        return obj.id && obj.name && (typeof obj.enable !== "undefined");
    }

    private anyConfigEnable(): boolean {
        let anyEnable = false;
        Object.keys(this.configs).forEach(value => {
            // @ts-ignore
            const item = this.configs[value] as CoverProviderConfig;
            if (!this.isCoverConfig(item)) {
                return;
            }
            anyEnable = anyEnable || item.enable;
        });
        return anyEnable;
    }

    /**
     * 配置或直接打开对话框
     * @private
     */
    private configOrShowDialog(protyle: IProtyle) {
        if (!this.anyConfigEnable()) {
            // 打开配置对话框
            showMessage(this.i18n.noEnableConfig);
            this.openSetting();
            return;
        }
        // 已有配置文件，直接打开对话框
        this.showDialog(protyle);
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

    private autoAddCoverIfAbsent(event: CustomEvent<{ protyle: IProtyle }>) {
        if (!this.configs.common.autoAddCoverIfAbsent) {
            console.log("关闭自动添加封面");
            return;
        }
        const protyle = event.detail.protyle;
        fetchPost("/api/attr/getBlockAttrs", {
            id: protyle.block.rootID,
        }, response => {
            const data = response.data as { id: string, title: string, "title-img": string, type: string; };
            if (data["title-img"]) {
                return;
            }
            showMessage((`文档 ${data.title} 不存在封面，准备生成随机封面`));
            let provider: CoverProvider<any>;
            this.providers.forEach(value => {
                if (value.config.randomEnable && !provider) {
                    provider = value;
                }
            });
            if (!provider) {
                showMessage(this.i18n.cantFindEnableRandom);
                return;
            }
            const maxPageNum = Math.floor(provider.maxRandomTotal() / provider.pageSize());
            console.log(`最大可随机页码 ${maxPageNum}`);
            let pageNum = Math.floor(Math.random() * maxPageNum);
            pageNum = pageNum > 1 ? pageNum : 1;
            provider.randomCovers(pageNum).then((result) => {
                    if (!result.items || result.items.length === 0) {
                        return;
                    }
                    let size = result.items.length;
                    size = Math.floor(Math.random() * size);
                    const image = result.items[size];
                    console.log("随机到封面：", image);
                    showMessage(`开始下载文档 ${data.title} 的封面`);
                    provider.downloadCover2({id: image.id, url: image.downloadUrl}).then(cover => {
                        console.log("cover", cover);
                        showMessage(`下载文档 ${data.title} 的封面完成`);
                        this.changeCover(null, provider, cover, protyle);
                    }).catch(reason => {
                        console.log(reason);
                        showMessage(`下载文档 ${data.title} 的封面完成`);
                    });
                }
            ).catch(reason => {
                console.log(reason);
                showMessage(`下载文档 ${data.title} 的封面失败：${reason}`);

            });
        });
    }

    private autoAddIconIfAbsent(event: CustomEvent<{ protyle: IProtyle }>) {
        if (!this.configs.common.autoAddIconIfAbsent) {
            console.log("关闭自动添加图标");
            return;
        }
        console.log(event);
        const protyle = event.detail.protyle;
        fetchPost("/api/attr/getBlockAttrs", {
            id: protyle.block.rootID,
        }, response => {
            const data = response.data as { id: string, title: string, icon: string; };
            if (data.icon) {
                return;
            }
            const allowIds = ["nature", "food", "activity", "travel", "objects"];
            const emoji = getRandomEmoji(allowIds);
            if (!emoji) {
                return;
            }
            console.log(`随机生成图标：${emoji}`);
            const background = protyle.background as Background;
            updateFileTreeEmoji(emoji, protyle.block.rootID);
            // updateOutlineEmoji(emoji, protyle.block.rootID);
            fetchPost("/api/attr/setBlockAttrs", {
                id: protyle.block.rootID,
                attrs: {"icon": emoji}
            });
            if (protyle.model) {
                protyle.model.parent.setDocIcon(emoji);
            }
            background.iconElement.classList.remove("fn__none");
        });
    }
}
