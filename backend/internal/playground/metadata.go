package playground

import sdk "github.com/DouDOU-start/airgate-sdk"

var PluginVersion = "0.1.0"

func BuildPluginInfo() sdk.PluginInfo {
	return sdk.PluginInfo{
		ID:          "airgate-playground",
		Name:        "AI Playground",
		Version:     PluginVersion,
		SDKVersion:  sdk.SDKVersion,
		Description: "Web-based AI chat playground with multi-model support and conversation management",
		Author:      "AirGate",
		Type:        sdk.PluginTypeExtension,
		Capabilities: []sdk.Capability{
			sdk.CapabilityHostForward,
			sdk.CapabilityHostListPlatforms,
			sdk.CapabilityHostListModels,
			sdk.CapabilityHostGetUserInfo,
		},
		FrontendPages: []sdk.FrontendPage{
			{
				Path:        "/playground",
				Title:       "AI Playground",
				Icon:        "message-square",
				Description: "AI chat playground",
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
