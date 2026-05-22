import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // TODO: i have no idea what the frick to do here!

    // -----
    // Basics (VPC/etc)
    // -----
    const vpc = new ec2.Vpc(this, "AppVPC", { maxAzs: 2 });

    // Pull Authentication credentials and branch for CI/CD
    const oauth = cdk.SecretValue.secretsManager("github-token");
    const owner = this.node.tryGetContext("githubOwner") ?? "auxdible";
    const repo = this.node.tryGetContext("githubRepo") ?? "aws-test";
    const branch = this.node.tryGetContext("githubBranch") ?? "master";

    // ------
    // CI/CD
    // ------

    // Source - pulled from GitHub
    const sourceArtifact = new codepipeline.Artifact();

    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: "Source",
      oauthToken: oauth,
      owner,
      repo,
      branch,
      output: sourceArtifact,
    });

    const outputArtifact = new codepipeline.Artifact();

    // CodeBuild portion of pipeline
    const pipelineCodeBuild = new codebuild.PipelineProject(
      this,
      "CDBuildApp",
      {
        vpc,
        buildSpec: codebuild.BuildSpec.fromObject({
          phases: {
            install: {
              commands: ["npm i -g pnpm", "pnpm i"],
              "runtime-versions": {
                nodejs: "22",
              },
            },
            build: {
              commands: ["pnpm run build"],
            },
          },
          artifacts: {
            files: ["./apps/web/dist/*"],
          },
        }),
      },
    );

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: "Build",
      project: pipelineCodeBuild,
      input: sourceArtifact,
      outputs: [outputArtifact],
    });

    const pipeline = new codepipeline.Pipeline(this, "CodePipeline", {
      pipelineName: "ApplicationPipeline",
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
        {
          stageName: "Build",
          actions: [buildAction],
        },
      ],
    });
  }
}
