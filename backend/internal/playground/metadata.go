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
			sdk.CapabilityForHostMethod(hostMethodUsersGet),
			sdk.CapabilityForHostMethod(hostMethodAssetsStore),
			sdk.CapabilityForHostMethod(hostMethodAssetsGetURL),
			sdk.CapabilityForHostMethod(hostMethodAssetsGetBytes),
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
