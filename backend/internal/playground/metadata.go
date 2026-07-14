package playground

import sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"

// PluginVersion defaults to the local development version.
// Release builds override it with the git tag via ldflags.
var PluginVersion = "dev"

func BuildPluginInfo() sdk.PluginInfo {
	return sdk.PluginInfo{
		ID:          "airgate-playground",
		Name:        "AI Chat",
		Version:     PluginVersion,
		SDKVersion:  sdk.SDKVersion,
		Description: "Web-based AI chat playground with multi-model support and conversation management",
		Author:      "HopBase",
		Type:        sdk.PluginTypeExtension,
		ConfigSchema: []sdk.ConfigField{
			{
				Key:         "max_conversations_per_user",
				Label:       "每用户最多会话数",
				Type:        "int",
				Default:     "10",
				Description: "达到上限后，用户需要先删除旧会话，才能创建新会话。填写 0 表示不限制。",
				Placeholder: "10",
			},
			{
				Key:         "chat_system_prompt",
				Label:       "自定义 System Prompt",
				Type:        "string",
				Default:     "",
				Description: "整体覆盖内置默认 system prompt（身份/语言跟随/Markdown 约定）。留空使用内置。注意：所路由分组的账号不能开启 claude_code_only（其 system 校验会拒绝自定义 prompt）。",
				Placeholder: "",
			},
			{
				Key:         "claude_prompt_cache",
				Label:       "Claude Prompt Caching",
				Type:        "bool",
				Default:     "true",
				Description: "多轮会话对 Claude 注入 cache_control 断点，历史前缀按缓存读价计费（约 0.1×）。上游不支持时会自动降级重试，本开关仅作应急兜底。",
			},
			{
				Key:         "chat_default_max_tokens",
				Label:       "默认 max_tokens 上限",
				Type:        "int",
				Default:     "32768",
				Description: "Claude 非思考请求的 max_tokens 上限（会再按模型 max_output 收紧）。计费按实际输出 tokens。",
				Placeholder: "32768",
			},
			{
				Key:         "web_search_enabled",
				Label:       "Web 搜索工具",
				Type:        "bool",
				Default:     "false",
				Description: "开启后模型可经服务端工具循环执行网页搜索（需同时配置 Tavily API Key，且前端为支持工具渲染的版本）。",
			},
			{
				Key:         "tavily_api_key",
				Label:       "Tavily API Key",
				Type:        "password",
				Default:     "",
				Description: "web_search 工具的搜索提供商密钥（tavily.com，免费额度 1000 次/月）。留空则搜索工具不注册。",
			},
			{
				Key:         "tool_loop_max_iterations",
				Label:       "工具循环最大迭代数",
				Type:        "int",
				Default:     "5",
				Description: "单条消息内模型↔工具往返的上限，触达后强制模型给出文本终答。",
				Placeholder: "5",
			},
			{
				Key:         "max_searches_per_message",
				Label:       "每消息搜索次数上限",
				Type:        "int",
				Default:     "3",
				Description: "单条消息内 web_search 的执行次数上限。",
				Placeholder: "3",
			},
		},
		Capabilities: []sdk.Capability{
			sdk.CapabilityForHostMethod(hostMethodGatewayForward),
			sdk.CapabilityForHostMethod(hostMethodUsersGet),
			sdk.CapabilityForHostMethod(hostMethodModelsList),
			sdk.CapabilityForHostMethod(hostMethodAssetsStore),
			sdk.CapabilityForHostMethod(hostMethodAssetsGetURL),
			sdk.CapabilityForHostMethod(hostMethodAssetsGetBytes),
			sdk.CapabilityForHostMethod(hostMethodAssetsDelete),
		},
		FrontendPages: []sdk.FrontendPage{
			{
				Path:        "/playground",
				Title:       "playground.title",
				Icon:        "message-square",
				Description: "AI chat playground",
				Audience:    "all",
			},
		},
	}
}
