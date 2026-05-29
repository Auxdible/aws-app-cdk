import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { WebStack } from "../web-stack";
import { ApiStack } from "../api-stack";

export class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: cdk.StageProps) {
    super(scope, id, props);
    const api = new ApiStack(this, "ApiStack");

    new WebStack(this, "AppStack", {
      apiUrl: api.apiUrl,
    });
  }
}
