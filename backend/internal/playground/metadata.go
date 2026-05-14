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
		Author:      "AirGate",
		Type:        sdk.PluginTypeExtension,
		Capabilities: []sdk.Capability{
			sdk.CapabilityForHostMethod(hostMethodGatewayForward),
			sdk.CapabilityForHostMethod(hostMethodPlatformsList),
			sdk.CapabilityForHostMethod(hostMethodModelsList),
			sdk.CapabilityForHostMethod(hostMethodUsersGet),
			sdk.CapabilityForHostMethod(hostMethodAssetsStore),
			sdk.CapabilityForHostMethod(hostMethodAssetsStoreURL),
			sdk.CapabilityForHostMethod(hostMethodAssetsGetURL),
			sdk.CapabilityForHostMethod(hostMethodAssetsGetBytes),
			sdk.CapabilityForHostMethod(hostMethodTasksCreate),
			sdk.CapabilityForHostMethod(hostMethodTasksUpdate),
			sdk.CapabilityForHostMethod(hostMethodTasksGet),
			sdk.CapabilityForHostMethod(hostMethodTasksList),
		},
		FrontendPages: []sdk.FrontendPage{
			{
				Path:        "/playground",
				Title:       "playground.title",
				Icon:        "message-square",
				Description: "AI chat playground",
				Audience:    "all",
			},
			{
				Path:        "/studio",
				Title:       "playground.workflow_title",
				Icon:        "image",
				Description: "Creative studio for image generation",
				Audience:    "all",
			},
		},
		ConfigSchema: []sdk.ConfigField{
			{
				Key:         "default_group_id",
				Label:       "Default Group ID",
				Type:        "int",
				Description: "Default channel group for new conversations",
				Default:     "1",
			},
			{
				Key:         "max_conversations",
				Label:       "Max Conversations Per User",
				Type:        "int",
				Description: "Maximum number of conversations per user (0 = unlimited)",
				Default:     "100",
			},
			{
				Key:         "max_context_messages",
				Label:       "Max Context Messages",
				Type:        "int",
				Description: "Maximum number of history messages sent as context",
				Default:     "50",
			},
		},
	}
}
