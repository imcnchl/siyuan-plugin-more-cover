// 以下代码拷贝自思源笔记
import {Siyuan} from "../index";

export const getDockByType = (type: string) => {
    const siyuan = window.siyuan as Siyuan;
    if (!siyuan.layout.leftDock) {
        return undefined;
    }
    if (siyuan.layout.leftDock.data[type]) {
        return siyuan.layout.leftDock;
    }
    if (siyuan.layout.rightDock.data[type]) {
        return siyuan.layout.rightDock;
    }
    if (siyuan.layout.bottomDock.data[type]) {
        return siyuan.layout.bottomDock;
    }
};