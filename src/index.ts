import {
    adaptHotkey,
    confirm,
    Dialog,
    fetchGet,
    getBackend,
    getFrontend,
    IModel,
    IWebSocketData,
    Menu,
    openTab,
    Plugin,
    Protyle,
    Setting,
    showMessage
} from "siyuan";
import "./index.scss";

const STORAGE_NAME = "more-cover-config";

export interface UnsplashUrls {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
    small_s3: string;
}

export interface UnsplashLinks {
    self: string;
    html: string;
    download: string;
    download_location: string;
}

export interface UnsplashUser {
    id: string;
    name: string;
}

export interface UnsplashImage {
    id: string;
    description: string;
    alt_description: string;
    urls: UnsplashUrls;
    links: UnsplashLinks;
    user: UnsplashUser
}

export interface UnsplashResp extends IWebSocketData {
    total: number;
    total_pages: number;
    results: UnsplashImage[];
}


export default class MoreCoverPlugin extends Plugin {

    private isMobile: boolean;

    onload() {
        this.data[STORAGE_NAME] = {
            unsplashAccessKey: "",
            unsplashSecretKey: ""
        };

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconMoreCoverPlugin" viewBox="0 0 32 32">
<path d="M6.659 1.333c0.681 0.001 1.242 0.512 1.322 1.171l0.001 0.006 0.009 0.156-0.001 2.667h12.027c3.577 0.003 6.494 2.824 6.65 6.363l0 0.014 0.005 0.289v12h2.663c0.736 0.001 1.332 0.597 1.332 1.333 0 0.681-0.51 1.243-1.169 1.323l-0.006 0.001-0.157 0.009h-2.663v2.667c-0.017 0.723-0.607 1.304-1.333 1.304-0.671 0-1.226-0.495-1.319-1.14l-0.001-0.007-0.008-0.156v-2.667h-12.025c-3.577-0.003-6.494-2.824-6.65-6.363l-0-0.014-0.005-0.289-0.001-12h-2.661c-0.736-0.001-1.332-0.597-1.332-1.333 0-0.681 0.51-1.243 1.169-1.323l0.006-0.001 0.157-0.009h2.661v-2.667c0-0.736 0.596-1.333 1.332-1.333h0zM7.989 8v12c0 0.001 0 0.002 0 0.003 0 2.124 1.657 3.861 3.749 3.99l0.011 0.001 0.235 0.007h12.025v-12c0-0.001 0-0.002 0-0.003 0-2.124-1.656-3.861-3.747-3.99l-0.011-0.001-0.235-0.007h-12.027z"></path>
<path d="M10.667 12c0-0.736 0.597-1.333 1.333-1.333s1.333 0.597 1.333 1.333v0c0 0.736-0.597 1.333-1.333 1.333s-1.333-0.597-1.333-1.333v0zM10.735 20.235c-0.043-0.086-0.068-0.187-0.068-0.294 0-0.146 0.047-0.28 0.126-0.39l-0.001 0.002 3.337-4.64c0.115-0.161 0.301-0.265 0.511-0.265 0.189 0 0.358 0.084 0.473 0.216l0.001 0.001 0.287 0.329c0.116 0.132 0.285 0.215 0.473 0.215 0.197 0 0.374-0.091 0.489-0.234l0.001-0.001 0.813-1.009c0.116-0.144 0.293-0.236 0.491-0.236 0.235 0 0.44 0.129 0.548 0.321l0.002 0.003 3.031 5.36c0.054 0.094 0.086 0.207 0.086 0.328s-0.031 0.232-0.086 0.329l0.002-0.003c-0.109 0.196-0.315 0.326-0.55 0.328h-9.395c-0.249-0.001-0.463-0.146-0.566-0.355l-0.002-0.004z"></path>
</symbol>`);

        // 添加插件按钮到顶栏
        this.addTopBar({
        // this.addTopBar({
            icon: "iconMoreCoverPlugin",
            title: this.i18n.topBarIcon,
            position: "right",
            callback: () => {
                console.log("-------callback");
                this.showDialog();
            }
        });

        const unsplashAccessKeyTextArea = document.createElement("textarea");
        const unsplashSecretKeyTextArea = document.createElement("textarea");
        this.setting = new Setting({
            confirmCallback: () => {
                this.saveData(STORAGE_NAME, {
                    unsplashAccessKey: unsplashAccessKeyTextArea.value,
                    unsplashSecretKey: unsplashSecretKeyTextArea.value
                });
            }
        });
        // 添加配置
        this.setting.addItem({
            title: "Unsplash Access Key",
            createActionElement: () => {
                unsplashAccessKeyTextArea.className = "b3-text-field fn__block";
                unsplashAccessKeyTextArea.placeholder = this.i18n.unsplashAccessKeyPlaceHolder;
                unsplashAccessKeyTextArea.value = this.data[STORAGE_NAME].unsplashAccessKey;
                return unsplashAccessKeyTextArea;
            },
        });
        this.setting.addItem({
            title: "Unsplash Secret Key",
            createActionElement: () => {
                unsplashSecretKeyTextArea.className = "b3-text-field fn__block";
                unsplashSecretKeyTextArea.placeholder = this.i18n.unsplashSecretKeyPlaceHolder;
                unsplashSecretKeyTextArea.value = this.data[STORAGE_NAME].unsplashSecretKey;
                return unsplashSecretKeyTextArea;
            },
        });
    }

    onLayoutReady() {
        this.loadData(STORAGE_NAME);
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        console.log(this.i18n.byePlugin);
    }

    private showDialog() {
        const dialog = new Dialog({
            title: this.i18n.topBarIcon,
            content: `<div class="b3-dialog__content" style="background: white">
    <div>
    <input id="more-cover-search-unsplash-input" type="text" placeholder="${this.i18n.searchUnsplashPlaceholder}"/>
    <button id="more-cover-search-unsplash-button">搜索</button>
    </div>
    <div class="fn__hr"></div>
    <div id="more-cover-search-unsplash-show" style="display: flex; flex-wrap: wrap; align-content: flex-start; background: white; padding: 12px 12px;">
        
    </div>
</div>`,
            width: this.isMobile ? "92vw" : "600px",
            height: "540px",
        });

        document.getElementById("more-cover-search-unsplash-button").addEventListener("click", () => {
            // @ts-ignore
            const searchValue = dialog.element.querySelector("#more-cover-search-unsplash-input").value;
            if (searchValue) {
                const url = "https://api.unsplash.com/search/photos?per_page=32&query=" + searchValue + "&client_id=" + this.data[STORAGE_NAME].unsplashAccessKey;
                fetchGet(url, (response: UnsplashResp) => {
                    if (response.total <= 0) {
                        console.log("找不到图片");
                        return;
                    }
                    const show = dialog.element.querySelector("#more-cover-search-unsplash-show");
                    response.results.forEach(value => {
                        const div = document.createElement("div");
                        div.style.width = "20%";
                        div.style.padding = "3px";
                        div.style.boxSizing = "border-box";
                        div.style.textAlign = "center";
                        div.innerHTML = `
                            <div role="button" tabindex="0"
                                style="user-select: none; transition: background 20ms ease-in 0s; cursor: pointer;">
                                <div style="width: 100%; height: 100%;">
                                <img src="${value.urls.thumb}"
                                        referrerpolicy="same-origin"
                                        style="display: block; object-fit: cover; border-radius: 3px; width: 100%; height: 64px; object-position: center 0;" alt="${value.alt_description}"/>
                                </div>
                            </div>
                            <div
                                style="font-size: 12px; line-height: 16px; color: rgba(55, 53, 47, 0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; margin-bottom: 4px;">
                                by <a href="${value.links.html}"
                                    target="_blank" rel="noopener noreferrer"
                                    style="display: inline; color: inherit; text-decoration: underline; user-select: none; cursor: pointer;">${value.user.name}</a>
                            </div>`;
                        show.appendChild(div);
                    });
                });
            }
        });
        // new Protyle(this.app, dialog.element.querySelector("#protyle"), {
        //     blockId: "20200812220555-lj3enxa",
        // });
        // fetchPost("/api/system/currentTime", {}, (response) => {
        //     dialog.element.querySelector("#time").innerHTML = new Date(response.data).toString();
        // });
        // console.log("searchValue=", searchValue);


    }

}
