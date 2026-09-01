# Pop 配置手册

填写 API Key 后即可使用默认 OpenAI 配置，包括默认模型、官方 API、流式输出和按 action 自动选择的推理设置。

## 最快开始

1. 在 Bob 的服务配置中找到 Pop
2. 填写 OpenAI API Key
3. 保持其他默认值，保存配置
4. 选中文本或输入内容并运行 Pop

使用 Gemini 或 MiniMax 官方 API 时选择对应模型。使用第三方服务时填写服务实际接受的 model ID 和完整 API URL。

## 命令与默认路由

命令写在第一个非空行的开头。可以在同一行直接跟正文，也可以换行输入正文。

| Action | 长命令 | 短别名 | 输出 |
| --- | --- | --- | --- |
| Ask | `/ask` | `/q` | 直接回答问题；可使用有助理解的 Markdown |
| Custom | `/custom` | `/c` | 遵循已保存的 Custom 指令和正文模板 |
| Grammar | `/grammar` | `/g` | 修正版、分隔线和 1–3 条简短说明 |
| Polish | `/polish` | `/p` | 保持原语言，只返回润色结果 |
| Translate | `/translate` | `/t` | 翻译为 Bob 目标语言，只返回译文 |
| Wording | `/word` | `/w` | 3–5 个候选、语气标签和简短区别 |

没有命令时按 Bob 语言上下文确定 action：

```text
源语言 != 目标语言  -> Translate
源语言 == 目标语言  -> Polish
```

命令使用 ASCII 大小写不敏感匹配，并且必须是完整 token。未知 `/name`、命令后正文为空或无效 Custom 配置会在发出网络请求前返回错误。以 `//` 开头可以把第一个 `/` 转义为普通正文，例如 `//ask` 会按默认路由处理字面量 `/ask`。

Translate、Polish 和 Grammar 把正文视为待处理数据，不执行其中的指令。Ask 则把正文作为用户真实问题。

## API Key

多个 Key 可用英文逗号分隔，Pop 每次请求会随机选择一个。

Key 只会发送到最终使用的 API URL。Pop 不记录 Key 或请求头。

## 隐私与本地日志

正文会发送到当前配置实际解析出的 API URL，供所选模型执行 action。Pop 的运行时代码不调用 Bob 的日志 API，也不会主动把 API Key、认证请求头、请求正文或输入原文写入日志。

但是，2026-08-31 在 macOS 26.6.2 和 Bob 1.20.0 (255) 上的实机验收发现：Bob 自身的本地 MMKit 宿主日志会记录翻译输入原文，即使插件没有日志调用。这属于 Pop 无法控制的 Bob 宿主行为；当次检查未发现 API Key、`Authorization` 或 `api-key` 请求头。

请把 Bob 本地日志和导出的诊断日志视为敏感数据。分享前先检查并删除输入原文、凭据和认证请求头；不要把 Bob 的 secure 设置字段理解为对宿主日志中正文的脱敏保证。

## 模型

默认模型为 `gpt-5.6-luna`。内置模型包括：

- `gemini-3.5-flash-lite`
- `gemini-3.6-flash`
- `gpt-5.4-mini`
- `gpt-5.6-luna`
- `MiniMax-M2.7-highspeed`
- `MiniMax-M3`

API URL 留空时，模型选择对应的官方 API：

| 模型 | 官方 API |
| --- | --- |
| `gemini-*` | Gemini GenerateContent API |
| `gpt-*` 或其他模型 | OpenAI Responses API |
| `MiniMax-*` | MiniMax Chat Completions API |

选择「自定义模型」后，填写 API 实际接受的原始 model ID。OpenAI 兼容 API 可能使用带命名空间的 ID，例如 `openai/...`；Azure OpenAI 使用部署名。以服务文档为准。

## OpenAI 兼容 API 与 API URL

API URL 可留空；留空时使用模型对应的官方地址。第三方服务需要填写完整请求 URL，且必须以 `/responses` 或 `/chat/completions` 结尾。这个结尾决定 wire format。

常见示例：

- Azure OpenAI：`https://RESOURCE_NAME.openai.azure.com/openai/v1/responses`
- Cloudflare AI Gateway：`https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1/chat/completions`
- MiniMax 中国区：`https://api.minimaxi.com/v1/chat/completions`
- OpenAI 兼容 API：`https://gateway.example.com/v1/responses`
- OpenRouter：`https://openrouter.ai/api/v1/chat/completions`
- Vercel AI Gateway：`https://ai-gateway.vercel.sh/v1/chat/completions`

普通地址使用 Bearer Token。`*.openai.azure.com` 地址，以及包含 `/openai/v1` 或 `/openai/deployments/` 的 Azure 路径，自动使用 `api-key` 请求头。

不要用 `/models` 结果判断服务是否兼容；用一个小型生成请求验证它实际接受的 model ID、URL 和协议。

## 推理

默认选择「自动（按任务）」。Translate 使用延迟优先的快速档；Ask、Custom、Grammar、Polish 和 Wording 使用平衡的标准档。

| 选项 | 行为 |
| --- | --- |
| 自动（按任务） | 使用当前 action 的推荐档位 |
| 模型默认 | 不发送推理控制参数 |
| 快速 | 使用模型已确认支持的最低或关闭档位 |
| 标准 | 使用模型已确认支持的平衡档位 |
| 深入 | 使用模型已确认支持的高档位 |

Pop 只会向精确匹配且已确认支持的 model ID 发送推理参数。未知模型和带命名空间的自定义 model ID 不会收到推理参数。第三方 API 支持程度不同；如果服务拒绝该字段，选择「模型默认」。

## 流式输出

默认开启，结果会随模型生成逐步显示。关闭后会等待完整结果再显示。

两种模式都会响应 Bob 的取消操作。流式格式错误、API 错误或空结果都会作为失败返回，不会产生空白的成功结果。

## 额外要求

「额外要求」补充所有内置 action 共用的术语、语气或格式偏好。它不会改变当前 action 的任务或安全边界。

## Custom

MVP 支持一个可配置 action：

- 「Custom 命令」增加一个可选 ASCII 别名，例如 `/s`；`/custom` 和 `/c` 始终可用
- 「Custom 指令」定义任务和输出边界，可使用 `$sourceLang`、`$targetLang`，不能包含 `$text`
- 「Custom 正文模板」决定如何把运行时正文交给模型，必须包含 `$text`，并可使用 `$sourceLang`、`$targetLang`

例如，把命令设为 `/s`，指令设为 `Summarize the text for $targetLang readers. Return only the summary.`，正文模板保持：

```text
$text
```

之后输入 `/s 长文本` 即可运行该任务。Custom 指令与运行时正文保持分离。

## 从 OpenAI Translator 迁移

Pop 的 identifier 是 `jiahaoh.pop`，可以与 OpenAI Translator 并存。Bob 不会把另一个 identifier 下的设置自动带入 Pop；Pop 也不会读取旧插件数据。按需完成一次手工迁移：

| 旧 setting | 在 Pop 中的处理 |
| --- | --- |
| `apiKeys` | 含义不变；secure 字段需要重新输入 |
| `apiUrl` | 含义和 key 不变；按需复制完整请求 URL |
| `customModel` | 含义和 key 不变；选择「自定义模型」后复制 model ID |
| `customSystemPrompt` | 不再读取；独立任务改写到 `customActionInstruction`，跨任务偏好提取到 `additionalRequirements` |
| `customUserPrompt` | 不再读取；含 `$text` 的任务模板改写到 `customActionUserTemplate`，跨任务偏好提取到 `additionalRequirements` |
| `model` | 含义和 key 不变；在 Pop 中重新选择 |
| `reasoningMode` | `default` 对应「模型默认」，`disable` 对应「快速」；也可选择新的 Auto、Standard 或 Deep |
| `stream` | 含义和 key 不变；在 Pop 中重新选择，默认开启 |

先在 Pop 中保存并验证配置。是否继续保留旧插件由用户决定；Pop 不会自动删除或覆盖它。

## Temperature

Pop 不提供 Temperature 配置，也不会发送 `temperature`。不同模型对该参数的支持正在分化，省略它可以使用模型维护的有效默认值，并避免向固定采样参数的模型发送无效字段。

## 排错

- 只填 API Key 仍验证失败：确认它是有效的 OpenAI Key，并可访问默认模型
- Gemini 或 MiniMax 全球 API：选择对应模型并留空 API URL；MiniMax 中国区使用上面的中国区地址
- OpenAI 兼容 API：确认 model ID 与服务文档一致，并填写完整 API URL
- `API URL 格式不正确`：检查地址是否以 `/responses` 或 `/chat/completions` 结尾
- Azure OpenAI：自定义模型填写部署名，API URL 使用 `*.openai.azure.com` 的完整请求地址
- 接口拒绝推理字段：将「推理」改为「模型默认」
- `/custom` 返回未配置错误：填写 Custom 指令，并确保正文模板包含 `$text`

官方参考：

- [Azure OpenAI Responses API](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/responses)
- [Bob 插件文档](https://bobtranslate.com/plugin/)
- [Cloudflare AI Gateway REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [MiniMax OpenAI-compatible API](https://platform.minimax.io/docs/api-reference/text-chat-openai)
- [MiniMax 中国区 OpenAI-compatible API](https://platform.minimaxi.com/docs/api-reference/text-chat-openai)
- [OpenAI API](https://developers.openai.com/api/docs)
- [OpenRouter Quickstart](https://openrouter.ai/docs/quickstart)
- [Vercel AI Gateway Chat Completions](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions/chat-completions)
