<p align="right">
  <a href="../README.md">简体中文</a> · <strong>English</strong>
</p>

# OpenAI Translator for Bob

Translate, polish, and correct grammar in [Bob](https://bobtranslate.com/) with OpenAI, Google Gemini, MiniMax, or an OpenAI-compatible API.

The default configuration uses OpenAI. Enter an API key after installation and start translating; change the other settings only when needed.

## Install and use

1. Install [Bob](https://bobtranslate.com/guide/) 1.8.0 or later.
2. Download and open the latest [openai-translator.bobplugin](https://github.com/nextai-translator/bob-plugin-openai-translator/releases/latest).
3. Open Bob's service settings, find OpenAI Translator, and enter an API key.
4. Save the configuration and translate.

## Configuration

For Gemini or MiniMax, select the corresponding [model](./configuration_manual_EN.md#model). For a third-party API service, enter the [model](./configuration_manual_EN.md#model) and full [API URL](./configuration_manual_EN.md#api-url) specified by the service.

See the configuration manual for [reasoning](./configuration_manual_EN.md#reasoning) and [additional requirements and Custom](./configuration_manual_EN.md#additional-requirements-and-custom).

## Features

- Translate every language supported by Bob.
- Polish and correct grammar when source and target languages match.
- Stream results by default and cancel in-flight requests.
- Select reasoning automatically by action, or choose Model default, Fast, Standard, or Deep.
- Share terminology, tone, or format requirements across actions and save one Custom text task.

## Development and contributions

See the [contribution guide](../.github/contributing.md) for the development environment, validation commands, and submission requirements. Runtime decisions and source references are in the [architecture notes](./architecture.md).
