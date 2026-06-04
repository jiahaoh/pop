<h4 align="right">
  <strong>简体中文</strong> | <a href="https://github.com/nextai-translator/bob-plugin-openai-translator/blob/main/docs/README_EN.md">English</a>
</h4>

<div>
  <h1 align="center">OpenAI Translator Bob Plugin</h1>
  <p align="center">
    <a href="https://github.com/nextai-translator/bob-plugin-openai-translator/releases" target="_blank">
        <img alt="release" src="https://github.com/nextai-translator/bob-plugin-openai-translator/actions/workflows/release.yaml/badge.svg">
    </a>
    <a href="https://github.com/nextai-translator/bob-plugin-openai-translator/releases">
        <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/nextai-translator/bob-plugin-openai-translator?style=flat">
    </a>
    <a href="https://github.com/nextai-translator/bob-plugin-openai-translator/releases">
        <img alt="GitHub Downloads (all assets, all releases)" src="https://img.shields.io/github/downloads/nextai-translator/bob-plugin-openai-translator/total">
    </a>
    <a href="https://github.com/nextai-translator/bob-plugin-openai-translator/releases">
        <img alt="language" src="https://img.shields.io/badge/language-TypeScript-brightgreen?style=flat&color=blue">
    </a>
  </p>
</div>

> **Note**
>
> 重要更新：非 macOS 用户可以使用我开发的基于 OpenAI API 的划词翻译浏览器插件 [openai-translator](https://github.com/yetone/openai-translator) 以解燃眉之急。

## 简介

ChatGPT 向我们展示了 GPT 模型的伟大之处，所以我使用 OpenAI 的 API 实现了这个 Bob 的翻译 + 润色 + 语法修改插件，效果拔群！

<details>

<summary>演示 👀</summary>

![演示](https://user-images.githubusercontent.com/1206493/221086195-f1ed941d-4dfa-4aa0-9d47-56c258a8f854.gif)

</details>


### 润色功能

此插件已支持使用 OpenAI API 对句子进行润色和语法修改，只需要把目标语言设置为与源语言一样即可，全面替代 Grammarly！而且理论上任何语言都可以润色，不仅仅是英语。

如果你不喜欢将翻译功能和文本润色功能放在一起，这里单独拆分出了一个专门用来文本润色和语法纠错的插件: [bob-plugin-openai-polisher](https://github.com/openai-translator/bob-plugin-openai-polisher)，这个润色插件具有更高级的润色功能，比如解释修改原因等。

## 使用方法

1. 安装 [Bob](https://bobtranslate.com/guide/#%E5%AE%89%E8%A3%85) (版本 >= 0.50)，一款 macOS 平台的翻译和 OCR 软件

2. 下载此插件: [openai-translator.bobplugin](https://github.com/nextai-translator/bob-plugin-openai-translator/releases/latest)

3. <details>

    <summary>安装此插件 👀</summary>

    ![安装步骤](https://user-images.githubusercontent.com/1206493/219937302-6be8d362-1520-4906-b8d6-284d01012837.gif)

   </details>

4. 去 [OpenAI](https://platform.openai.com/account/api-keys) 获取你的 API KEY

5. 把 API KEY 填入 Bob 偏好设置 > 服务 > 此插件配置界面的 API KEY 的输入框中
    - 如果你想了解关于其他设置的更多信息，请查看[配置手册](./docs/configuration_manual_CN.md)

        <details>

        <summary>演示 👀</summary>

        ![设置步骤](https://user-images.githubusercontent.com/1206493/219937398-8e5bb8d2-7dc8-404a-96e7-a937e08c939f.gif)

        </details>


6. <details>

   <summary>安装 PopClip 实现划词后鼠标附近出现悬浮图标 👀</summary>

   [![PopClip](https://user-images.githubusercontent.com/1206493/219933584-d0c2b6cf-8fa0-40a6-858f-8f4bf05f38ef.gif)](https://bobtranslate.com/guide/integration/popclip.html)

   </details>

## 贡献

如果你想要为 OpenAI Translator Bob Plugin 做出贡献，请阅读[贡献指南](.github/contributing.md)中的说明。我们可以先从这个[列表中的问题](https://github.com/nextai-translator/bob-plugin-openai-translator/contribute)开始。

## 感谢

我这只是个小小的 Bob 插件，强大的是 Bob 本身，向它的开发者 [ripperhe](https://github.com/ripperhe) 致敬！

<!--
<a href="https://api.gitsponsors.com/api/badge/link?p=CCTAcO52X68ppJ/My08020IxahBsfD6PUbrqKuOwPrq9S62VS6Ws2GohPnu+c7iLZCl1VMGgi9XUBFCbUqSf5Tu5kxKOygBDoLTUpUqbpET/qDO3asPc9qXuWMW4025U5MHsXaE0VScm35uM38/z0w==">
  <img src="https://api.gitsponsors.com/api/badge/img?id=603668088" height="90">
</a>
-->
