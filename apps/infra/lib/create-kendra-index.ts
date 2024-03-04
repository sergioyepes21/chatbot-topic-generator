import { loadEnvironmentVariables } from '@chatbot-topic/environment-configuration';
import * as cdk from 'aws-cdk-lib';
import * as kendra from 'aws-cdk-lib/aws-kendra';
import * as iam from 'aws-cdk-lib/aws-iam';

const config = loadEnvironmentVariables({
  INDEX_NAME: {
    constraint: 'required',
  }
});

export function createKendraIndex(
  this: cdk.Stack,
): cdk.aws_kendra.CfnIndex {

  const kendraIndexRole = createKendraIndexRole.bind(this)();

  const kendraIndex = new kendra.CfnIndex(this, 'FAQIndex', {
    name: config.INDEX_NAME,
    edition: 'DEVELOPER_EDITION',
    roleArn: kendraIndexRole.roleArn,
  });

  return kendraIndex;
}

function createKendraIndexRole(
  this: cdk.Stack,
): iam.Role {
  const kendraIndexRole = new iam.Role(this, 'KendraIndexRole', {
    assumedBy: new iam.ServicePrincipal('kendra.amazonaws.com'),
  });

  kendraIndexRole.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    resources: ['*'],
    actions: [

    ]
  }));

  kendraIndexRole.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    resources: ['*'],
    actions: [
      "cloudwatch:PutMetricData"
    ],
    conditions: {
      StringEquals: {
        "cloudwatch:namespace": "AWS/Kendra"
      },
    }
  }));

  kendraIndexRole.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    resources: ['*'],
    actions: [
      "logs:DescribeLogGroups"
    ],
  }));

  kendraIndexRole.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    resources: ["arn:aws:logs:us-east-1:702442044531:log-group:/aws/kendra/*"],
    actions: [
      "logs:CreateLogGroup"
    ],
  }));

  kendraIndexRole.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    resources: [
      "arn:aws:logs:us-east-1:702442044531:log-group:/aws/kendra/*:log-stream:*"
    ],
    actions: [
      "logs:DescribeLogStreams",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ],
  }));

  return kendraIndexRole;
}