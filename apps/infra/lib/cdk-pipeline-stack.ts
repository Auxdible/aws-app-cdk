import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as pipelines from "aws-cdk-lib/pipelines";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ssm from "aws-cdk-lib/aws-ssm";
export class CDKPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CODEPIPELINE
    // GitHub Integration
    const oauth = cdk.SecretValue.secretsManager("github-token");
    const owner = new cdk.CfnParameter(this, "OwnerName", {
      type: "String",
      default: "auxdible",
      noEcho: true,
    });
    const repo = new cdk.CfnParameter(this, "RepoName", {
      type: "String",
      default: "cdk-test",
      noEcho: true,
    });
    const branch = new cdk.CfnParameter(this, "BranchName", {
      type: "String",
      default: "master",
      noEcho: true,
    });

    const pipeline = new pipelines.CodePipeline(this, "InfraPipeline", {
      synth: new pipelines.ShellStep("Synth", {
        input: pipelines.CodePipelineSource.gitHub(
          owner.valueAsString + "/" + repo.valueAsString,
          branch.valueAsString,
          {
            authentication: oauth,
          },
        ),
        commands: [
          "npm i -g pnpm",
          "pnpm ci",
          "pnpm run build",
          "cd ./apps/infra",
          "pnpx cdk synth",
        ],
        primaryOutputDirectory: "./apps/infra/cdk.out",
      }),
      pipelineName: "TestApp-InfraPipeline",
    });
  }
}
