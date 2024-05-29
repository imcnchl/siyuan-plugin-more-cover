[English](https://github.com/imcnchl/siyuan-plugin-more-cover/blob/main/README.md)

# 思源笔记-随机题头图插件

<font color="red">**注意：首次使用或更新插件后需要重启SiYuan，让插件生效**</font>

## 配置

1. 打开配置页面 ![open_config1.png](https://s2.loli.net/2023/08/21/NO6gTbWQZPHAuaI.png)
2. 填入申请到的 Unsplash 或 Pixabay 密钥 ![open_config2.png](https://s2.loli.net/2023/08/21/F3sOdBfoxNTMAiQ.png)

## 使用

1. 首次使用，请关闭所有已打开的标签页
2. 点击随机题头图 ![click_random1.png](https://s2.loli.net/2023/08/21/8hmIfbWANBoRyg9.png) 
3. 选择你喜欢的图片 ![select.png](https://s2.loli.net/2023/08/21/tI6GjbNMWq2nmBl.png) ![select2.png](https://s2.loli.net/2023/08/21/YtNMmH5JAKgzyfD.png)

由于网络原因，可能有些图库无法使用，可以通过配置思源的代理进行加速
![proxy.png](https://s2.loli.net/2023/08/21/b4CiLeZzFU7o5PH.png)

## 申请各个图库的接口

### 申请 Unsplash

访问地址：https://unsplash.com/developers

1. 点击 Your apps ![unsplash_your_apps.png](https://s2.loli.net/2023/08/21/IZitYmy2hDk6fxW.png)
2. 新建一个应用 ![unsplash_new_application.png](https://s2.loli.net/2023/08/21/2ZEq6rOUXklPosS.png)
3. 拷贝你的Access Key ![unsplash_copy_access_key.png](https://s2.loli.net/2023/08/21/uLes6DEnQSfIwaq.png)
4. 填入配置面板中 ![unsplash_config.png](https://s2.loli.net/2023/08/21/n6kq5OcuRWwSrI3.png)

### 申请 Pixabay

访问地址：https://pixabay.com/api/docs/

1. 拷贝Key ![pixabay_key.png](https://s2.loli.net/2023/08/21/xdQnz5p2jsMVaH3.png)

# 变更记录

## v1.1.0

* 代码重构
* 

## v1.0.9

* v1.0.8版本在更新后，重新打开思源会显示需要再次更新

## v1.0.8

* 使用注意事项

## v1.0.7

* 修复已存在题头图时无法点击刷新图标唤起插件
* 修复下载时的loading图层显示超出 Dialog 的body
* 替换题头图时使用SiYuan自带的 render 方法
* 监听 loaded-protyle 事件替换为 loaded-protyle-static 事件
* 刷新图标的文案由“内置”调整为“随机题头图”

## v1.0.6

* 兼容 3.0.12 感谢 @code-lixm

## v1.0.5

* 重新上架集市

## v1.0.4

* 支持黑暗主题
* 切换图库时页码设置为 1

## v1.0.3

* 修改 README

## v1.0.2

* pixabay 支持选择语言

## v1.0.1

* 代理配置说明
* 正确对接 Unsplash 的接口

## v1.0.0

* 支持 Unsplash 和 Pixabay







