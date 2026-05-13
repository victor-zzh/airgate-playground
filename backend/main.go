package main

import (
	sdkgrpc "github.com/DouDOU-start/airgate-sdk/runtimego/grpc"

	"github.com/DouDOU-start/airgate-playground/backend/internal/playground"
)

func main() {
	sdkgrpc.Serve(playground.New())
}
