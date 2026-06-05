import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as dynamoDB from "aws-cdk-lib/aws-dynamodb";
export class DBStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Build the database
  }
}
