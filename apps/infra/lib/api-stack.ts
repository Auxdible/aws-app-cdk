import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as api_gateway from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as path from "node:path";
import * as dynamoDB from "aws-cdk-lib/aws-dynamodb";
export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const myTable = new dynamoDB.TableV2(this, "MyTable", {
      partitionKey: { name: "pk", type: dynamoDB.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const healthLambda = new lambda.Function(this, "HealthLambda", {
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda/health")),
      handler: "index.health_handler",
      runtime: lambda.Runtime.PYTHON_3_14,
      environment: {
        TABLE_NAME: myTable.tableName,
      },
    });
    myTable.grantFullAccess(healthLambda);

    const healthIntegration = new integrations.HttpLambdaIntegration(
      "HealthIntegration",
      healthLambda,
    );
    const api = new api_gateway.HttpApi(this, "HttpApi", {
      corsPreflight: {
        allowCredentials: false,
        allowOrigins: ["*"],
        allowMethods: [api_gateway.CorsHttpMethod.ANY],
        allowHeaders: ["Content-Type", "Authorization"],
        maxAge: cdk.Duration.hours(1),
      },
    });

    api.addRoutes({
      path: "/health",
      methods: [api_gateway.HttpMethod.GET],
      integration: healthIntegration,
    });

    this.apiUrl = api.url || "";
  }
}
