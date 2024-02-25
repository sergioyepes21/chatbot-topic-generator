import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as customResources from 'aws-cdk-lib/custom-resources';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kendra from 'aws-cdk-lib/aws-kendra';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { CfnBot, CfnBotProps } from 'aws-cdk-lib/aws-lex';
import { join } from 'path';
import { loadEnvironmentVariables } from "@chatbot-topic/environment-configuration";

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
  INDEX_ROLE_ARN: {
    constraint: 'required',
  },
  FAQ_ROLE_ARN: {
    constraint: 'required',
  },
  LEX_BOT_NAME: {
    constraint: 'required',
  },
  LEX_BOT_ROLE_ARN: {
    constraint: 'required',
  },
});

const lambdaEntryFolder = join(__dirname + '../../../', 'backend/src/handlers');

export class ChatBotInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {

    super(scope, id, props);

    const s3Bucket = this.createFAQBucket();

    const kendraIndex = this.createKendraIndex();

    const faqFeederHandler = this.createFAQFeederLambdaFunction(s3Bucket, kendraIndex);

    const faqFeederApi = this.createFAQFeederAPI(faqFeederHandler);
  }

  private createFAQBucket(

  ): cdk.aws_s3.Bucket {
    const s3Bucket = new s3.Bucket(this, 'FAQBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: config.S3_BUCKET_NAME,
    });

    return s3Bucket;
  }

  private createKendraIndex(

  ): cdk.aws_kendra.CfnIndex {

    const kendraIndex = new kendra.CfnIndex(this, 'FAQIndex', {
      name: config.INDEX_NAME,
      edition: 'DEVELOPER_EDITION',
      roleArn: config.INDEX_ROLE_ARN,
    });

    return kendraIndex;
  }

  private createFAQFeederLambdaFunction(
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

  private createLexBotResourceHandler() {
    const entry = join(__dirname + '../../../', 'backend/src/handlers/lex-bot-resource-handler.ts');

    const lexBotResourceHandler = new lambdaNodejs.NodejsFunction(this, 'LexBotResourceHandler', {
      functionName: 'lex-bot-resource-function',
      description: 'A Lambda function to handle Lex Bot resource',
      entry: entry,
      logRetention: logs.RetentionDays.ONE_DAY,
      timeout: cdk.Duration.seconds(10),
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      architecture: lambda.Architecture.ARM_64,
    });

    const lexBotResourcePolicy = new iam.PolicyStatement({
      actions: [
        "lex:CreateBot",
        "lex:UpdateBot",
        "lex:CreateBotVersion",
        "lex:CreateBotLocale",
        "lex:CreateIntent",
        "lex:CreateSlot",
        "lex:DeleteBot",
        "iam:PassRole",
        "iam:CreateRole",
      ],
      effect: iam.Effect.ALLOW,
      resources: [
        "*"
      ],
    });
    lexBotResourceHandler.addToRolePolicy(lexBotResourcePolicy);

    const lexBotProvider = new customResources.Provider(this, 'LexBotProvider', {
      onEventHandler: lexBotResourceHandler,
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    const _lexBotCustomResource = new cdk.CustomResource(this, 'LexBot', {
      serviceToken: lexBotProvider.serviceToken,
      properties: {
        Locale: 'en_US',
        ChildDirected: false,
        BotRoleArn: 'arn:aws:iam::702442044531:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots_IKPFYX31WVB'
      }
    });
  }

  private createLexBot() {

    const botFallbackIntent: CfnBot.IntentProperty = {
      name: 'FallbackIntent',
      sampleUtterances: [
        {
          utterance: 'I don\'t know',
        },
        {
          utterance: 'I don\'t understand'
        }
      ],
      description: 'Fallback intent for the bot',
      initialResponseSetting: {
        codeHook: {
          isActive: true,
          enableCodeHookInvocation: true,
          postCodeHookSpecification: {
            successResponse: undefined,
            successNextStep: {
              dialogAction: {
                type: 'ElicitIntent',
              }
            },
            timeoutNextStep: {
              dialogAction: {
                type: 'ElicitIntent',
              }
            },
            failureNextStep: {
              dialogAction: {
                type: 'ElicitIntent',
              }
            }
          }
        },
        nextStep: {
          dialogAction: {
            type: 'InvokeDialogCodeHook',
          }
        }
      }
    };

    const botENUSLocale: CfnBot.BotLocaleProperty =
    {
      localeId: 'en_US',
      nluConfidenceThreshold: 0.4,
      voiceSettings: {
        voiceId: 'Danielle',
        engine: 'neural',
      },
      intents: [
        botFallbackIntent
      ]
    };

    const lexBot = new CfnBot(this, config.LEX_BOT_NAME, {
      name: config.LEX_BOT_NAME,
      description: 'A bot to answer frequently asked questions',
      dataPrivacy: {
        childDirected: false,
      },
      roleArn: config.LEX_BOT_ROLE_ARN,
      botLocales: [botENUSLocale],
      idleSessionTtlInSeconds: 300,
    });

    return lexBot;
  }
}
