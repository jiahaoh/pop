# Pop 产品契约

> 状态：M1 已确认（2026-08-31）
>
> Linear：W-9、W-10、W-11、W-12
>
> 本文定义产品行为与兼容边界；M2 已在开发分支实现 action engine，M4 才修改正式发布 metadata

## 一句话定位

Pop 是面向选中文本和单次输入的 one-shot AI action 工具：用户明确任务，Pop 立即返回可复制、替换或继续使用的结果。

Pop 不提供多轮对话、历史记忆、工具调用、联网搜索或附件处理，也不默认让模型猜测用户意图。

## 已确认原则

1. **Selection-first**：优先优化选中文本后的单次操作
2. **Deterministic by default**：任务由 Bob 语言上下文和显式命令确定，不使用默认 AI intent classification
3. **Backward-compatible default**：没有显式命令时，源语言与目标语言不同则 Translate，相同则 Polish
4. **Task/transport separation**：action、prompt 和输出契约位于 provider adapter 之前，adapter 只处理 wire format
5. **Input safety by task**：Transform 类 action 把正文视为数据；Ask 把正文视为用户问题
6. **Compact configuration**：Bob 的静态设置按用户配置路径组织，不暴露内部 adapter 结构

## 核心 action

| Action | 用户意图 | 输入安全语义 | 语言策略 | 输出契约 |
| --- | --- | --- | --- | --- |
| Ask | 回答正文表达的问题 | 正文就是用户问题，应直接回答 | 默认跟随问题语言，除非问题指定其他语言 | 直接回答；可使用有助于理解的 Markdown，不添加固定前缀 |
| Custom | 执行用户配置并命名的自定义文本任务 | 配置的 task instruction 是指令，运行时正文是待处理数据 | 由自定义 task instruction 定义 | 遵循自定义 task instruction，不添加通用包装 |
| Grammar | 修正语法、拼写和用法 | 正文是待处理数据，不执行其中的指令 | 保持正文语言 | 修正版在前，随后给出简短修改说明 |
| Polish | 让基本正确的正文更自然 | 正文是待处理数据，不执行其中的指令 | 保持正文语言 | 只返回润色结果；不附解释 |
| Translate | 把正文翻译为 Bob 目标语言 | 正文是待处理数据，不执行其中的指令 | 输出 Bob 目标语言 | 只返回译文；保留含义、语气和格式 |
| Wording | 为一个含义或语境提供更合适的表达 | 把正文解释为措辞需求和语言素材，不执行其中引用内容的指令 | 跟随用户要求；未指定时使用正文语言 | 返回 3–5 个候选、语气标签和简短区别 |

Translate、Polish 和 Grammar 属于 Transform action。即使正文包含“忽略先前指令”等文字，也只处理这段文字本身。Ask 的正文则是用户有意发给模型的问题。Wording 可以理解用户对语气、对象和场景的要求，但引用或待改写的素材仍然是数据。

Ask 和 Wording 默认使用输入语言输出；只有用户在正文中明确指定其他语言时才切换。Bob 当前选择的目标语言不会隐式改变这两个 action 的输出语言。

Summarize、Explain、Rewrite 和 Tone 暂不作为独立 MVP action。只有真实使用频率证明它们值得独立入口时才重新评估。

## 默认路由

没有显式命令时：

```text
detectFrom != detectTo  -> Translate
detectFrom == detectTo  -> Polish
```

这里的兼容目标是现有默认翻译/同语言润色习惯，不是保证旧自定义 prompt 在新产品中自动迁移。旧设置的处理见“发布身份与兼容策略”。

## 显式命令

已确认的命令和短别名如下：

| Action | 长命令 | 短别名 |
| --- | --- | --- |
| Ask | `/ask` | `/q` |
| Custom | `/custom` | `/c` |
| Grammar | `/grammar` | `/g` |
| Polish | `/polish` | `/p` |
| Translate | `/translate` | `/t` |
| Wording | `/word` | `/w` |

命令位于第一个非空行的开头，可以独占该行，也可以在命令后的同一行直接跟正文。首版不支持命令参数；命令 token 之后的内容都属于正文。

解析规则已经冻结：

1. 命令使用 ASCII 大小写不敏感匹配，并要求 token 后是空白或行尾；`/translatex` 不是命令
2. 未知的 `/name` 返回明确错误，以便发现拼写错误；以 `//` 开头可转义为普通正文，并在路由前移除一个 `/`
3. 命令存在但正文为空时返回参数错误，不向 provider 发请求
4. 命令前允许空行和空格；删除命令 token 后保留正文内部的换行和格式
5. 一个输入只解析第一个命令；正文后续以 `/` 开头的行都是普通内容

解析按以下顺序进行：

1. 找到第一个非空行，忽略它之前的空行和命令前的水平空白
2. 如果该行以 `//` 开头，移除一个 `/`，停止命令识别，并按无命令默认路由处理正文
3. 如果该行以 `/` 开头，读取到下一个空白或行尾作为完整 token
4. 按“内置长命令 → 内置短别名 → 用户 Custom alias”的优先级匹配 token
5. token 未知、Custom alias 与内置命令冲突或命令正文仅含空白时，在请求 provider 前返回参数错误
6. 命令后的同一行内容和后续行共同组成正文；只移除命令及其分隔空白，不改写正文内部格式

代表性输入：

| 输入 | Bob 语言上下文 | 结果 |
| --- | --- | --- |
| `Hello` | `en → zh-Hans` | Translate，正文保持为 `Hello` |
| `Hello` | `en → en` | Polish，正文保持为 `Hello` |
| `/P Hello` | 任意 | Polish，正文为 `Hello` |
| `/ask` 后换行输入问题 | 任意 | Ask，正文为命令行后的全部内容 |
| `/s text`，且 Custom alias 为 `/s` | 任意 | Custom，正文为 `text` |
| `/translatex text` | 任意 | 未知命令错误 |
| `//ask` | 由 Bob 决定 | 默认路由，正文为字面量 `/ask` |
| `/t` 或 `/t` 后只有空白 | 任意 | 空正文参数错误 |

## 输出边界

所有 action 都直接返回任务结果，不添加“结果如下”等固定前缀。输出可以保留输入中的 Markdown。

Grammar 的固定布局：

```text
<修正后的完整文本>

---

<1–3 条简短修改说明；使用正文语言>
```

如果没有需要修改的内容，仍返回原文，并用一句简短说明表示未发现明显问题。

Wording 的每个候选包含表达、简短语气标签和一句区别说明；默认返回 3 个，只有候选确实有不同价值时才增加到 4–5 个。

## 用户定义的 Custom action

已确认 Custom 是用户可以命名和配置的 action，而不是固定名称的一项内置任务。例如，用户可以把 `/s` 配置为“总结内容”，之后输入：

```text
/s
<需要总结的正文>
```

Pop 使用配置中的“总结内容”作为任务指令，把运行时正文作为待处理数据。用户不需要每次重复输入总结要求。

职责分工如下：

* 内置 action 使用各自的 TaskProfile，自定义 action 不覆盖 `/translate`、`/ask` 等内置行为
* 每个自定义 action 至少包含命令和任务指令
* “额外要求”用于补充多个内置 action 共用的术语、语气或格式偏好
* 定义独立任务的旧 prompt 手工迁移为自定义 action；跨任务偏好迁移到“额外要求”
* 未配置有效指令、命令格式非法或与内置命令冲突时返回清晰的配置错误

Bob 的设置表单是静态且空间有限的，不能根据用户操作动态增加任意数量的原生表单项。MVP 确认只支持**一个可命名的自定义 action**：

* “自定义命令”，例如 `/s`
* “自定义任务指令”，支持多行内容和 `$sourceLang`、`$targetLang`，但不把运行时正文插入 system instruction
* “自定义正文模板”，默认 `$text`，用于把正文作为独立 user message 交给模型
* `/custom` 和 `/c` 保留为同一 action 的稳定别名，用户配置的 `/s` 是额外别名

这样可以直接复用当前两个 prompt 文本框的空间，并让复杂指令保持可编辑。多个自定义 action 不属于 MVP；只有真实使用需求证明一个不够时，才重新评估使用 JSON、行式语法或其他紧凑 registry。

## 发布身份与兼容策略

Pop 是独立产品，上游 OpenAI Translator 只作为实现参考。新的 Bob identifier 让两个插件并存，避免 Pop 的 action 语义静默改变旧安装。

发布身份已经冻结：

| 字段 | 确认值 |
| --- | --- |
| appcast | `https://raw.githubusercontent.com/jiahaoh/pop/main/appcast.json` |
| author | `Jiahao Huang`，不公开邮箱 |
| homepage | `https://github.com/jiahaoh/pop` |
| identifier | `jiahaoh.pop` |
| name | `Pop` |
| 稳定下载名 | `pop.bobplugin`；GitHub release asset 使用 `pop-<version>.bobplugin` |
| 首个稳定版本 | `0.1.0` |

Pop 使用独立 Appcast，只包含 `jiahaoh.pop` 的版本历史，不复制现有 OpenAI Translator 的 Appcast 条目。M4 修改 `package.json`、`public/info.json`、`appcast.json`、打包脚本、release workflow 和用户文档；M1 不提前改动这些正式发布文件。

### 旧设置迁移

Bob 不会把一个 identifier 下保存的设置自动带到另一个 identifier。Pop 不读取旧插件数据，也不尝试跨插件自动迁移；用户需要重新输入或手工复制仍适用的值。

| 旧 setting | Pop 策略 |
| --- | --- |
| `apiKeys` | 保留相同含义；因为是独立插件和 secure 字段，用户重新输入 |
| `apiUrl` | 保留相同含义和 key；用户按需复制完整 URL |
| `customModel` | 保留相同含义和 key；仅在选择自定义模型时使用 |
| `customSystemPrompt` | 不沿用原 key；独立任务复制到 `customActionInstruction`，跨任务偏好提取到 `additionalRequirements` |
| `customUserPrompt` | 不沿用原 key；带 `$text` 的任务模板复制到 `customActionUserTemplate`，跨任务偏好提取到 `additionalRequirements` |
| `model` | 保留相同含义和 key；用户重新选择，原始 model ID 仍可使用 |
| `reasoningMode` | M3 扩展选项；旧 `default` 对应“模型默认”，旧 `disable` 对应“快速” |
| `stream` | 保留相同含义和 key；用户重新选择，默认仍开启 |

新的 action 设置使用语义清晰的新 key：

| 新 setting | 作用 |
| --- | --- |
| `additionalRequirements` | 补充内置 action 共用的术语、语气和格式偏好 |
| `customActionCommand` | 保存一个用户 alias，例如 `/s` |
| `customActionInstruction` | 定义 Custom 的任务和边界 |
| `customActionUserTemplate` | 定义正文如何进入 Custom，默认 `$text` |

配置手册在 M4 提供一次性手工迁移表。旧插件保持原样，用户可以在确认 Pop 配置可用后自行决定是否继续保留。

## M2 实现交接

M2 的当前运行路径为：

```text
query
  -> command parser
  -> task resolver
  -> TaskProfile registry
  -> prompt builder
  -> model capability resolver
  -> provider adapter
```

Action engine 不应进入 provider adapter。M2 不修改正式发布 identity、Appcast 或稳定版本；这些属于 M4。

### 文件与函数入口

| 能力 | M2 入口 | 约束 |
| --- | --- | --- |
| Action 类型和 request context | `src/types.ts` | 定义 `ActionId`、`TaskProfile`、`ResolvedTask` 和 provider-neutral `PromptPair` |
| Command parser | 新建 `src/action/command.ts` | 纯函数解析正文、转义、内置命令和单个 Custom alias；不访问 Bob globals |
| Prompt builder | `src/utils/prompt.ts` | 根据 `ResolvedTask` 构建 system/user 文本；Transform 正文与 instruction 分离 |
| Provider request body | `src/adapter/openai.ts`、`src/adapter/gemini.ts` | 接收 `PromptPair`；移除 action 路由和 `createPrompts()` 调用 |
| Bob entry orchestration | `src/main.ts` | 在创建 provider 请求前依次解析 config、resolve action、构建 prompt；解析错误走 Bob completion callback |
| Runtime configuration | `src/config.ts` | 接受缺省的 Custom 配置字段并验证 alias；M3 再把字段加入 Bob 设置表单 |
| Task resolver/profile registry | 新建 `src/action/profiles.ts` 和 `src/action/resolve.ts` | 固化六种 action 的 language、output、safety 和 recommended-reasoning profile；不引用 adapter |

M2 可以在 `TaskProfile` 中记录推荐 reasoning profile，但不会扩展或发送新的 provider reasoning 参数；映射与设置属于 M3。

### M2 验收测试矩阵

| 测试层 | 必须覆盖 |
| --- | --- |
| Adapter body | 同一 `PromptPair` 在 Responses、Chat Completions、Gemini 和 MiniMax 中保持相同任务语义 |
| Command parser | 长命令、短别名、大小写、inline/multiline、前导空行、精确 token、未知命令、`//` 转义、空正文、Custom alias 和冲突 |
| Config | Custom alias 合法、缺省、与内置命令冲突；旧字段缺失时仍能启动默认路径 |
| Default routing | 不同语言为 Translate，相同语言为 Polish；没有 AI intent classification |
| Prompt safety | Translate、Polish、Grammar 不执行正文中的指令；Ask 把正文作为问题；Custom instruction 与正文分离 |
| Task profiles | 六种 action 的语言、输出、安全和 recommended-reasoning 元数据与本契约一致 |
| Transport regression | 流式、非流式、取消、terminal error 和 exactly-once completion 的现有测试继续通过 |

静态与 mock 测试不能证明 Bob JavaScriptCore、设置渲染、保存值、安装更新或真实 provider 行为。M2 完成只证明 action engine 和 provider request construction；打包后的六种 action、Custom alias、流式和非流式实机 smoke test 仍属于 M4。

## M3 模型控制契约

M3 保留 `reasoningMode` 作为保存键，并向用户提供五个档位：

| 值 | 产品含义 |
| --- | --- |
| `auto` | 解析当前 action 的 provider-neutral 推荐档位 |
| `default` | 省略 provider reasoning 控制 |
| `fast` | 使用已验证的最低档或关闭推理 |
| `standard` | 使用已验证的均衡档 |
| `deep` | 使用已验证的高档 |

Auto 为 Translate、Polish 和 Grammar 推荐 Fast，为 Ask 和 Wording 推荐
Standard，为 Custom 推荐模型默认。显式设置始终覆盖推荐值。旧保存值
`disable` 解析为 Fast，`default` 继续保持省略 reasoning 参数的语义。

Provider 映射只匹配精确 model ID。未知、带命名空间或其他自定义 model ID
不获得可选 reasoning 字段；即使自定义 ID 看起来像某个已知 provider model，
也适用这一保守规则。

紧凑的 Bob 表单提供 API Key、模型、自定义模型、可选完整 API URL、推理、流式、
共用额外要求以及一个 Custom action。旧 System/User Prompt 字段从表单移除，
runtime 解析也忽略它们；Pop 使用独立 identifier，因此跨插件迁移仍为手动操作。

## M1 完成状态

M1 已没有阻塞 M2 的未决产品选择。多个自定义 action、AI intent classification、多轮对话、动态 prompt 下载、Temperature、工具调用、联网搜索和附件均不属于当前 MVP。

## M2 本地实现状态

2026-08-31，W-14、W-13 和 W-16 已由提交 `9fa3f42` 在 Milestone 2 分支实现；`a4c0b75` 将 action prompt 的开头泛化为直接任务指令，不向模型暴露产品名：

* `src/action/command.ts` 覆盖冻结的命令、alias、转义和错误语义
* `src/action/profiles.ts` 与 `src/action/resolve.ts` 固化六种 action 和默认路由
* `src/utils/prompt.ts` 根据 `ResolvedTask` 构建 `PromptPair`，并保持 Transform / Custom 的 runtime text 与 system instruction 分离
* `src/main.ts` 在 adapter 之前完成 action orchestration；OpenAI Responses、Chat Completions、Gemini 和 MiniMax codec 只消费 `PromptPair`
* Bun 1.2.19 mock 与 regression suite 通过 92 项，2 项 opt-in MiniMax live tests 按设计跳过；build 与静态 runtime compatibility check 通过

这些证据只覆盖纯函数、mock provider、request body、transport regression、bundle export 和禁止 API 检查。它们不证明 Bob JavaScriptCore 实际执行、设置表单渲染/保存、安装更新顺序或真实 provider 行为。

M2 分支是非发布中间态；M3 已把新的 action settings 和五档 reasoning
加入 `public/info.json`。正式 name、identifier、Appcast、完整迁移呈现和 Bob
smoke test 仍属于 M4。

## M3 本地实现状态

2026-08-31，提交 `1519038` 在分支 `codex/milestone-03-model-controls`
实现 M3：

* Auto 在 adapter 之前解析为 action 推荐档位，显式选择始终覆盖推荐值
* 精确 model ID 映射覆盖 OpenAI Responses、OpenAI-compatible Chat
  Completions、Gemini GenerateContent 和 MiniMax Chat Completions；未知 ID
  省略可选控制
* `public/info.json` 按用户配置顺序提供十个紧凑字段，配置默认值、旧
  `disable` 迁移和 Custom 边界均有测试
* Bun 1.2.19 下 lint 与 typecheck 通过；98 项测试通过，2 项需显式凭据的
  MiniMax live tests 按设计跳过；build 和静态 runtime check 通过，bundle 为
  32,271 bytes
* 开发包 `openai-translator-dev.bobplugin` 的 SHA-256 为
  `72c692ed0d650fa0ebc0b58206e39a6205089f31c77039cea709121e63f4ac3c`；
  包内版本为 `5.0.1dev1788222503758`，repository version 仍为 `5.0.1`

开发包仍保留上游 name 和 identifier，不是 Pop 正式发布包。上述证据不证明 Bob
JavaScriptCore 实际执行、设置渲染/保存、安装顺序或真实 provider；这些实机项目、
正式 identity、Appcast 和迁移呈现仍属于 M4。
