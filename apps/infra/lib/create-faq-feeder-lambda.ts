import * as cdk from 'aws-cdk-lib';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as kendra from "aws-cdk-lib/aws-kendra";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { join } from 'path';
import { loadEnvironmentVariables } from '@chatbot-topic/environment-configuration';

const lambdaEntryFolder = join(__dirname + '../../../', 'backend/src/handlers');

const config = loadEnvironmentVariables({
  OPENAI_API_KEY: {
    constraint: 'required',
  },
  S3_BUCKET_NAME: {
    constraint: 'required',
  },
  FAQ_ROLE_ARN: {
    constraint: 'required',
  },
});

export function createFAQFeederLambdaFunction(
  this: cdk.Stack,
  s3Bucket: s3.Bucket,
  kendraIndex: kendra.CfnIndex,
): lambdaNodejs.NodejsFunction {
  const faqFeederHandler = new lambdaNodejs.NodejsFunction(this, 'FAQFeederFunction', {
    functionName: 'faq-feeder-function',
    description: 'A Lambda function to handle Lex Bot resource',
    entry: join(lambdaEntryFolder, 'faq-feeder-handler.ts'),
    handler: 'faqFeederHander',
    environment: {
      OPENAI_API_KEY: config.OPENAI_API_KEY,
      S3_BUCKET_NAME: s3Bucket.bucketName,
      FAQ_ROLE_ARN: config.FAQ_ROLE_ARN,
      INDEX_ID: kendraIndex.ref,
    },
    logRetention: logs.RetentionDays.ONE_DAY,
    timeout: cdk.Duration.seconds(10),
    runtime: lambda.Runtime.NODEJS_20_X,
    memorySize: 128,
  });

  const faqFeederPolicy = new iam.PolicyStatement({
    actions: [
      "s3:PutObject",
      "kendra:CreateFaq",
      "iam:PassRole",
    ],
    effect: iam.Effect.ALLOW,
    resources: [
      "*"
    ],
  });
  faqFeederHandler.addToRolePolicy(faqFeederPolicy);
  return faqFeederHandler;
}