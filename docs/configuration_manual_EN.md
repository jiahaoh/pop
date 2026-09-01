# Configuration Manual

Enter an API key to use the default OpenAI configuration: the default model, official API, streaming output, and task-aware automatic reasoning.

## Quick start

1. Find OpenAI Translator in Bob's service settings.
2. Enter an OpenAI API key.
3. Save the configuration and translate.

For the official Gemini or MiniMax API, select the corresponding model. For a third-party API service, enter the model and full API URL specified by the service.

## API key

Separate multiple keys with commas to select one randomly for each request.

A key is sent only to the resolved API URL. The plugin does not log keys or request headers.

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

After selecting Custom model, enter the model ID accepted by the API. An OpenAI-compatible API may use a namespaced ID such as `openai/...`; follow the service documentation. Azure OpenAI uses a deployment name.

## API URL

The API URL may be empty. An empty value uses the official endpoint selected by the model.

For a third-party API service, enter the full request URL. The plugin currently supports OpenAI-compatible APIs and Azure OpenAI, and the URL must end in `/responses` or `/chat/completions`. The suffix selects the request format.

Common examples:

- Azure OpenAI: `https://RESOURCE_NAME.openai.azure.com/openai/v1/responses`
- Cloudflare AI Gateway: `https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1/chat/completions`
- MiniMax China: `https://api.minimaxi.com/v1/chat/completions`
- OpenAI-compatible API: `https://gateway.example.com/v1/responses`
- OpenRouter: `https://openrouter.ai/api/v1/chat/completions`
- Vercel AI Gateway: `https://ai-gateway.vercel.sh/v1/chat/completions`

With an API URL, ordinary hosts use a Bearer token. A `*.openai.azure.com` host or an Azure path containing `/openai/v1` or `/openai/deployments/` automatically uses the `api-key` header.

## Streaming

Streaming is enabled by default, so text appears as the model generates it. Disable it to wait for the complete result.

Both modes respond to Bob's cancellation action. Invalid stream data, API errors, and empty responses are returned as failures rather than blank successful results.

## Reasoning

The default is Auto. Translate, Polish, and Grammar use the latency-oriented Fast profile; Ask and Wording use the balanced Standard profile; Custom uses the model default because the user defines its complexity.

| Setting | Behavior |
| --- | --- |
| Auto | Use the recommendation for the current action |
| Model default | Omit reasoning controls |
| Fast | Use the lowest or disabled level verified for the model |
| Standard | Use the balanced level verified for the model |
| Deep | Use the high level verified for the model |

The plugin sends a reasoning field only for an exact model ID with verified support. Unknown and namespaced custom model IDs receive no reasoning field. Support varies between third-party APIs; use Model default if the service rejects the field.

## Additional requirements and Custom

Additional requirements add terminology, tone, or formatting preferences shared by every built-in action. They do not replace the selected action or its safety boundary.

Custom uses three fields:

- Custom command adds one optional ASCII alias such as `/s`; `/custom` and `/c` remain available
- Custom instruction defines the task and output boundary, may use `$sourceLang` and `$targetLang`, and cannot contain `$text`
- Custom user template controls how runtime text is presented, must contain `$text`, and may use `$sourceLang` and `$targetLang`

For example, set the command to `/s`, the instruction to `Summarize the text for $targetLang readers. Return only the summary.`, and keep this user template:

```text
$text
```

Entering `/s Long text` now runs that custom task. The task instruction and runtime text remain separate.

## Temperature

The plugin has no Temperature setting and does not send `temperature`. Model support for this parameter now differs, so omission uses a valid model-maintained default and avoids sending an invalid field to models with fixed sampling.

## Troubleshooting

- Validation fails with only an API key: confirm that it is a valid OpenAI key with access to the default model.
- Gemini or the global MiniMax API: select the corresponding model and leave the API URL empty; for MiniMax China, use the China API URL above.
- OpenAI-compatible API: use the model ID from its documentation and enter the full API URL.
- `Invalid API URL`: ensure the address ends in `/responses` or `/chat/completions`.
- Azure OpenAI: enter the deployment name as the custom model and use the full `*.openai.azure.com` request URL.
- The translation API rejects reasoning fields: set Reasoning to Model default.

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
