import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { loadEnvironmentVariables } from "@chatbot-topic/environment-configuration";
import { createLexBot } from './create-lex-bot';
import { createFAQFeederLambdaFunction } from './create-faq-feeder-lambda';
import { createKendraIndex } from './create-kendra-index';

const config = loadEnvironmentVariables({
  OPENAI_API_KEY: {
    constraint: 'required',
  },
  S3_BUCKET_NAME: {
    constraint: 'required',
  },
  INDEX_NAME: {
    constraint: 'optional',
    default: 'FAQIndex',
  },
  FAQ_ROLE_ARN: {
    constraint: 'required',
  },
  LEX_BOT_NAME: {
    constraint: 'required',
  },
});


export class ChatBotInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {

    super(scope, id, props);

    const s3Bucket = this.createFAQBucket();

    const kendraIndex = createKendraIndex.bind(this)();

    const lexBot = createLexBot.bind(this)(kendraIndex);

    const faqFeederHandler = createFAQFeederLambdaFunction.bind(this)(kendraIndex);

    const faqFeederApi = this.createFAQFeederAPI(faqFeederHandler);
  }

  private createFAQBucket(

  ): cdk.aws_s3.Bucket {
    const s3Bucket = new s3.Bucket(this, 'FAQBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: config.S3_BUCKET_NAME,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    return s3Bucket;
  }

  private createFAQFeederAPI(
    faqFeederHandler: lambdaNodejs.NodejsFunction,
  ): apigatewayv2.HttpApi {
    const api = new apigatewayv2.HttpApi(this, 'FAQFeederApi', {
      apiName: 'faq-feeder-api',
      description: 'An API to handle FAQ feeder requests',
    });

    const faqFeederIntegration = new HttpLambdaIntegration('FAQFeederIntegration', faqFeederHandler);
    api.addRoutes({
      path: '/faq-feeder',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: faqFeederIntegration,
    });

    return api;
  }
}
