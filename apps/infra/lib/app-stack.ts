import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as api_gateway from "aws-cdk-lib/aws-lambda";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "node:path";
export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
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
    // Static Website (CloudFront/S3)
    // ------
    const outputBucket = new s3.Bucket(this, "WebsiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
    });
    const distribution = new cloudfront.Distribution(
      this,
      "MyAppDistribution",
      {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(outputBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.minutes(5),
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.minutes(5),
          },
        ],
      },
    );
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
          version: "0.2",
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
            files: ["**/*"],
            "base-directory": "apps/web/dist",
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

    const deployAction = new codepipeline_actions.S3DeployAction({
      actionName: "Deploy",
      input: outputArtifact,
      bucket: outputBucket,
      extract: true,
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
        {
          stageName: "Deploy",
          actions: [deployAction],
        },
      ],
    });
    // ------
    // BACKEND (Lambdas/APIGateway)
    // ------

    const healthLambda = new lambda.Function(this, "HealthLambda", {
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda/health")),
      handler: "index.health_handler",
      runtime: lambda.Runtime.PYTHON_3_14,
    });
  }
}
