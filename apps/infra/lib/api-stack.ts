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

    const myTable = new dynamoDB.TableV2(this, "KanbanTable", {
      partitionKey: { name: "id", type: dynamoDB.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const api = new api_gateway.HttpApi(this, "HttpApi", {
      corsPreflight: {
        allowCredentials: false,
        allowOrigins: ["*"],
        allowMethods: [api_gateway.CorsHttpMethod.ANY],
        allowHeaders: ["Content-Type", "Authorization"],
        maxAge: cdk.Duration.hours(1),
      },
    });
    const getTodosLambda = new lambda.Function(this, "GetTodo", {
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda/todos")),
      handler: "get.get_all_todos",
      runtime: lambda.Runtime.PYTHON_3_14,
      environment: {
        TABLE_NAME: myTable.tableName,
      },
    });
    myTable.grantReadData(getTodosLambda);

    const getTodosIntegration = new integrations.HttpLambdaIntegration(
      "GetTodoIntegration",
      getTodosLambda,
    );

    const postTodoLambda = new lambda.Function(this, "PostTodo", {
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda/todos")),
      handler: "post.post_todo",
      runtime: lambda.Runtime.PYTHON_3_14,
      environment: {
        TABLE_NAME: myTable.tableName,
      },
    });
    myTable.grantFullAccess(postTodoLambda);

    const postTodosIntegration = new integrations.HttpLambdaIntegration(
      "PostTodoIntegration",
      postTodoLambda,
    );

    const deleteTodoLambda = new lambda.Function(this, "HealthLambda", {
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda/todos")),
      handler: "delete.delete_todo",
      runtime: lambda.Runtime.PYTHON_3_14,
      environment: {
        TABLE_NAME: myTable.tableName,
      },
    });
    myTable.grantFullAccess(deleteTodoLambda);

    const deleteTodoIntegration = new integrations.HttpLambdaIntegration(
      "DeleteTodoIntegration",
      deleteTodoLambda,
    );

    const patchTodoLambda = new lambda.Function(this, "PatchTodoLambda", {
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda/todos")),
      handler: "patch.patch_todoo",
      runtime: lambda.Runtime.PYTHON_3_14,
      environment: {
        TABLE_NAME: myTable.tableName,
      },
    });
    myTable.grantFullAccess(patchTodoLambda);

    const patchTodoIntegration = new integrations.HttpLambdaIntegration(
      "PatchTodoIntegration",
      patchTodoLambda,
    );

    api.addRoutes({
      path: "/todos",
      methods: [api_gateway.HttpMethod.GET],
      integration: getTodosIntegration,
    });
    api.addRoutes({
      path: "/todos",
      methods: [api_gateway.HttpMethod.POST],
      integration: postTodosIntegration,
    });
    api.addRoutes({
      path: "/todos",
      methods: [api_gateway.HttpMethod.DELETE],
      integration: deleteTodoIntegration,
    });
    api.addRoutes({
      path: "/todos",
      methods: [api_gateway.HttpMethod.PATCH],
      integration: patchTodoIntegration,
    });

    this.apiUrl = api.url || "";
  }
}
