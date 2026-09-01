<p align="right">
  <strong>简体中文</strong> · <a href="./docs/README_EN.md">English</a>
</p>

# Pop for Bob

Pop 是面向选中文本和单次输入的 one-shot AI action 工具。它在 [Bob](https://bobtranslate.com/) 中提供翻译、润色、语法检查、问答、措辞建议和一个可配置任务，不是多轮聊天机器人。

默认配置使用 OpenAI。安装后填写 API Key 即可使用；也可选择 Google Gemini、MiniMax 或填写 OpenAI 兼容 API 的完整地址。

## 安装与快速开始

1. 安装 [Bob](https://bobtranslate.com/guide/) 1.8.0 或更高版本
2. 从 [Releases](https://github.com/jiahaoh/pop/releases/latest) 下载并打开最新的 `pop-<version>.bobplugin`
3. 在 Bob 的服务配置中找到 Pop，填写 API Key 并保存
4. 选中文本或输入内容，按 Bob 当前语言直接运行，或在第一行使用 action 命令

完整设置顺序和常见错误见[最快开始](./docs/configuration_manual_CN.md#最快开始)。

## Actions

| Action | 命令 | 结果 |
| --- | --- | --- |
| Ask | `/ask`、`/q` | 直接回答正文表达的问题 |
| Custom | `/custom`、`/c` 或用户别名 | 执行已保存的自定义文本任务 |
| Grammar | `/grammar`、`/g` | 返回修正版和简短说明 |
| Polish | `/polish`、`/p` | 保持原语言并只返回润色结果 |
| Translate | `/translate`、`/t` | 翻译为 Bob 目标语言 |
| Wording | `/word`、`/w` | 返回 3–5 个带语气说明的候选 |

没有命令时，源语言与目标语言不同会 Translate，相同会 Polish。命令解析、转义和错误行为见[命令与默认路由](./docs/configuration_manual_CN.md#命令与默认路由)。

## 配置

常用路径只有 API Key、[模型](./docs/configuration_manual_CN.md#模型)和可选完整 [API URL](./docs/configuration_manual_CN.md#openai-兼容-api-与-api-url)。[推理](./docs/configuration_manual_CN.md#推理)默认按当前 action 自动选择；[Custom](./docs/configuration_manual_CN.md#custom)可以保存一个命令、任务指令和正文模板。

Pop 使用独立 identifier，可以与 OpenAI Translator 并存，但不会自动读取旧插件设置。一次性手工处理方法见[从 OpenAI Translator 迁移](./docs/configuration_manual_CN.md#从-openai-translator-迁移)。

处理敏感内容前，请先了解 [Bob 本地宿主日志边界](./docs/configuration_manual_CN.md#隐私与本地日志)。

## 开发与贡献

开发环境、验证命令和提交要求见[贡献指南](./.github/contributing.md)。运行时设计和外部依据见[架构说明](./docs/architecture.md)。静态测试和 archive 检查不能证明 Bob 已安装或执行插件；运行时改动还必须完成 [Bob 实机 smoke test](./docs/bob_smoke_test.md)。
