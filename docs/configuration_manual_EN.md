# Pop Configuration Manual

Enter an API key to use the default OpenAI configuration: the default model, official API, streaming output, and task-aware automatic reasoning.

## Quick start

1. Find Pop in Bob's service settings
2. Enter an OpenAI API key
3. Keep the other defaults and save the configuration
4. Run Pop on selected or entered text

For the official Gemini or MiniMax API, select the corresponding model. For a third-party service, enter the model ID and full API URL that the service actually accepts.

## Commands and default routing

Put a command at the start of the first non-empty line. The body can follow on the same line or start on the next line.

| Action | Long command | Short alias | Output |
| --- | --- | --- | --- |
| Ask | `/ask` | `/q` | Directly answer the question; useful Markdown is allowed |
| Custom | `/custom` | `/c` | Follow the saved Custom instruction and user template |
| Grammar | `/grammar` | `/g` | Corrected text, a divider, and 1–3 short notes |
| Polish | `/polish` | `/p` | Keep the language and return only the polished text |
| Translate | `/translate` | `/t` | Translate into Bob's target language and return only the translation |
| Wording | `/word` | `/w` | 3–5 candidates with tone labels and brief differences |

Without a command, Bob's language context selects the action:

```text
source language != target language  -> Translate
source language == target language  -> Polish
```

Command matching is ASCII case-insensitive and requires a complete token. An unknown `/name`, an empty command body, or invalid Custom configuration returns an error before any network request. Start with `//` to escape the first slash as ordinary text: `//ask` follows default routing with the literal body `/ask`.

Translate, Polish, and Grammar treat the body as data and do not execute instructions inside it. Ask treats the body as the user's real question.

## API key

Separate multiple keys with commas to select one randomly for each request.

A key is sent only to the resolved API URL. Pop does not log keys or request headers.

## Privacy and local logs

The source text is sent to the resolved API URL so the selected model can run the action. Pop's runtime code does not call Bob's logging API and does not deliberately write API keys, authentication headers, request bodies, or source text to logs.

However, installed-host validation on 2026-08-31 with macOS 26.6.2 and Bob 1.20.0 (255) found that Bob's local MMKit host log records translation source text even when the plugin makes no logging call. This is Bob host behavior outside Pop's control. The inspected log contained no API key, `Authorization` header, or `api-key` header.

Treat Bob's local and exported diagnostic logs as sensitive data. Inspect and remove source text, credentials, and authentication headers before sharing them. A secure settings field does not guarantee source-text redaction from host logs.

## Model

The default model is `gpt-5.6-luna`. Built-in models are:

- `gemini-3.5-flash-lite`
- `gemini-3.6-flash`
- `gpt-5.4-mini`
- `gpt-5.6-luna`
- `MiniMax-M2.7-highspeed`
- `MiniMax-M3`

With an empty API URL, the model selects the official API:

| Model | Official API |
| --- | --- |
| `gemini-*` | Gemini GenerateContent API |
| `gpt-*` or any other model | OpenAI Responses API |
| `MiniMax-*` | MiniMax Chat Completions API |

After selecting Custom model, enter the raw model ID accepted by the API. An OpenAI-compatible API may use a namespaced ID such as `openai/...`; Azure OpenAI uses a deployment name. Follow the service documentation.

## OpenAI-compatible API and API URL

The API URL may be empty; an empty value uses the official endpoint selected by the model. A third-party service needs the full request URL ending in `/responses` or `/chat/completions`. This suffix selects the wire format.

Common examples:

- Azure OpenAI: `https://RESOURCE_NAME.openai.azure.com/openai/v1/responses`
- Cloudflare AI Gateway: `https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1/chat/completions`
- MiniMax China: `https://api.minimaxi.com/v1/chat/completions`
- OpenAI-compatible API: `https://gateway.example.com/v1/responses`
- OpenRouter: `https://openrouter.ai/api/v1/chat/completions`
- Vercel AI Gateway: `https://ai-gateway.vercel.sh/v1/chat/completions`

Ordinary hosts use a Bearer token. A `*.openai.azure.com` host, or an Azure path containing `/openai/v1` or `/openai/deployments/`, automatically uses the `api-key` header.

Do not use a `/models` response as proof of compatibility. Verify the actual model ID, URL, and protocol with a small generation request.

## Reasoning

The default is Auto. Translate, Polish, and Grammar use the latency-oriented Fast profile; Ask and Wording use the balanced Standard profile; Custom uses the model default because the user defines its complexity.

| Setting | Behavior |
| --- | --- |
| Auto | Use the recommendation for the current action |
| Model default | Omit reasoning controls |
| Fast | Use the lowest or disabled level verified for the model |
| Standard | Use the balanced level verified for the model |
| Deep | Use the high level verified for the model |

Pop sends a reasoning field only for an exact model ID with verified support. Unknown and namespaced custom model IDs receive no reasoning field. Support varies between third-party APIs; use Model default if the service rejects the field.

## Streaming

Streaming is enabled by default, so the result appears as the model generates it. Disable it to wait for the complete result.

Both modes respond to Bob's cancellation action. Invalid stream data, API errors, and empty responses are returned as failures rather than blank successful results.

## Additional requirements

Additional requirements add terminology, tone, or formatting preferences shared by every built-in action. They do not replace the selected action or its safety boundary.

## Custom

The MVP supports one configured action:

- Custom command adds one optional ASCII alias such as `/s`; `/custom` and `/c` remain available
- Custom instruction defines the task and output boundary, may use `$sourceLang` and `$targetLang`, and cannot contain `$text`
- Custom user template controls how runtime text is presented, must contain `$text`, and may use `$sourceLang` and `$targetLang`

For example, set the command to `/s`, the instruction to `Summarize the text for $targetLang readers. Return only the summary.`, and keep this user template:

```text
$text
```

Entering `/s Long text` now runs that task. The Custom instruction and runtime text remain separate.

## Migrate from OpenAI Translator

Pop's identifier is `jiahaoh.pop`, so it can coexist with OpenAI Translator. Bob does not carry settings from another identifier into Pop, and Pop does not read the other plugin's data. Apply the relevant values once:

| Old setting | Handling in Pop |
| --- | --- |
| `apiKeys` | Same meaning; re-enter the value because it is a secure field |
| `apiUrl` | Same meaning and key; copy the full request URL when needed |
| `customModel` | Same meaning and key; copy the model ID after selecting Custom model |
| `customSystemPrompt` | No longer read; move an independent task into `customActionInstruction`, or shared preferences into `additionalRequirements` |
| `customUserPrompt` | No longer read; move a task template containing `$text` into `customActionUserTemplate`, or shared preferences into `additionalRequirements` |
| `model` | Same meaning and key; select it again in Pop |
| `reasoningMode` | `default` maps to Model default and `disable` maps to Fast; Auto, Standard, and Deep are also available |
| `stream` | Same meaning and key; select it again in Pop; the default remains enabled |

Save and validate the Pop configuration first. Whether to keep the old plugin is the user's decision; Pop does not delete or overwrite it.

## Temperature

Pop has no Temperature setting and does not send `temperature`. Model support for this parameter now differs, so omission uses a valid model-maintained default and avoids sending an invalid field to models with fixed sampling.

## Troubleshooting

- Validation fails with only an API key: confirm that it is a valid OpenAI key with access to the default model
- Gemini or the global MiniMax API: select the corresponding model and leave the API URL empty; for MiniMax China, use the China API URL above
- OpenAI-compatible API: use the model ID from its documentation and enter the full API URL
- `Invalid API URL`: ensure the address ends in `/responses` or `/chat/completions`
- Azure OpenAI: enter the deployment name as the custom model and use the full `*.openai.azure.com` request URL
- The API rejects reasoning fields: set Reasoning to Model default
- `/custom` reports a missing configuration: enter a Custom instruction and ensure the user template contains `$text`

Official references:

- [Azure OpenAI Responses API](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/responses)
- [Bob plugin documentation](https://bobtranslate.com/plugin/)
- [Cloudflare AI Gateway REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [MiniMax China OpenAI-compatible API](https://platform.minimaxi.com/docs/api-reference/text-chat-openai)
- [MiniMax OpenAI-compatible API](https://platform.minimax.io/docs/api-reference/text-chat-openai)
- [OpenAI API](https://developers.openai.com/api/docs)
- [OpenRouter Quickstart](https://openrouter.ai/docs/quickstart)
- [Vercel AI Gateway Chat Completions](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions/chat-completions)
