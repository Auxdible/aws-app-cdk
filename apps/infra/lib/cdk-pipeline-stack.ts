import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as pipelines from "aws-cdk-lib/pipelines";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { BuildSpec } from "aws-cdk-lib/aws-codebuild";
import { AppStage } from "./stages/app-stage";
export class CDKPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CODEPIPELINE
    // GitHub Integration
    const oauth = cdk.SecretValue.secretsManager("github-token");

    const owner = this.node.tryGetContext("githubOwner") ?? "auxdible";
    const repo = this.node.tryGetContext("githubRepo") ?? "aws-test";
    const branch = this.node.tryGetContext("githubBranch") ?? "master";

    const pipeline = new pipelines.CodePipeline(this, "InfraPipeline", {
      synth: new pipelines.ShellStep("Synth", {
        input: pipelines.CodePipelineSource.gitHub(owner + "/" + repo, branch, {
          authentication: oauth,
        }),
        commands: [
          "npm i -g pnpm",
          "pnpm i --no-frozen-lockfile",
          "pnpm run build",
          "cd ./apps/infra",
          `pnpx cdk synth -c githubOwner=${owner} -c githubRepo=${repo} -c githubBranch=${branch}`,
        ],
        primaryOutputDirectory: "./apps/infra/cdk.out",
      }),
      codeBuildDefaults: {
        partialBuildSpec: BuildSpec.fromObject({
          phases: {
            install: {
              "runtime-versions": {
                nodejs: "22",
              },
            },
          },
        }),
      },
      synthCodeBuildDefaults: {
        partialBuildSpec: BuildSpec.fromObject({
          phases: {
            install: {
              "runtime-versions": {
                nodejs: "22",
              },
            },
          },
        }),
      },
      pipelineName: "TestApp-InfraPipeline",
    });
    pipeline.addStage(new AppStage(this, "AppStage", {}));
  }
}
