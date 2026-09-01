<p align="right">
  <a href="../README.md">简体中文</a> · <strong>English</strong>
</p>

# Pop for Bob

Pop is a selection-first, one-shot AI action tool for [Bob](https://bobtranslate.com/). It translates, polishes, checks grammar, answers questions, suggests wording, and runs one configured task. It is not a multi-turn chatbot.

The default configuration uses OpenAI. Enter an API key after installation, or select Google Gemini or MiniMax, or enter the full URL of an OpenAI-compatible API.

## Install and start

1. Install [Bob](https://bobtranslate.com/guide/) 1.8.0 or later
2. Download and open the latest `pop-<version>.bobplugin` from [Releases](https://github.com/jiahaoh/pop/releases/latest)
3. Find Pop in Bob's service settings, enter an API key, and save
4. Run the action on selected or entered text with Bob's current languages, or put an action command on the first line

See [Quick start](./configuration_manual_EN.md#quick-start) for the complete setting order and common errors.

## Actions

| Action | Command | Result |
| --- | --- | --- |
| Ask | `/ask`, `/q` | Directly answer the question expressed by the body |
| Custom | `/custom`, `/c`, or the user alias | Run the saved custom text task |
| Grammar | `/grammar`, `/g` | Return the corrected text and a short explanation |
| Polish | `/polish`, `/p` | Keep the language and return only the polished text |
| Translate | `/translate`, `/t` | Translate Chinese into English and other languages into Simplified Chinese |
| Wording | `/word`, `/w` | Return 3–5 candidates with tone notes |

Without a command, different source and target languages select Translate; matching languages select Polish. See [Commands and default routing](./configuration_manual_EN.md#commands-and-default-routing) for parsing, escaping, and error behavior.

## Configuration

The common path needs only an API key, a [model](./configuration_manual_EN.md#model), and an optional full [API URL](./configuration_manual_EN.md#openai-compatible-api-and-api-url). [Reasoning](./configuration_manual_EN.md#reasoning) defaults to the recommendation for the current action. [Custom](./configuration_manual_EN.md#custom) saves one command, task instruction, and user template.

Pop has an independent identifier and can coexist with OpenAI Translator, but it does not read settings from that plugin. Follow [Migrate from OpenAI Translator](./configuration_manual_EN.md#migrate-from-openai-translator) once to re-enter or copy the applicable values.

Before processing sensitive content, review the [Bob local host-log boundary](./configuration_manual_EN.md#privacy-and-local-logs).

## Development and contributions

See the [contribution guide](../.github/contributing.md) for the development environment, validation commands, and submission requirements. Runtime decisions and source references are in the [architecture notes](./architecture.md). Static tests and archive inspection do not prove that Bob installed or executed a package; runtime changes also require the [Bob host smoke test](./bob_smoke_test.md).
