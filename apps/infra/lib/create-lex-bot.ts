import * as cdk from 'aws-cdk-lib';
import * as kendra from 'aws-cdk-lib/aws-kendra';
import * as lex from 'aws-cdk-lib/aws-lex';
import { loadEnvironmentVariables } from '@chatbot-topic/environment-configuration';
import * as iam from 'aws-cdk-lib/aws-iam';


const config = loadEnvironmentVariables({
  LEX_BOT_NAME: {
    constraint: 'required',
  },
});

export function createLexBot(
  this: cdk.Stack,
  kendraIndex: kendra.CfnIndex,
): lex.CfnBot {

  const botFallbackIntent: lex.CfnBot.IntentProperty = {
    name: 'FallbackIntent',
    parentIntentSignature: 'AMAZON.FallbackIntent',
    description: 'Fallback intent for the bot',
    initialResponseSetting: {
      codeHook: {
        isActive: true,
        enableCodeHookInvocation: true,
        postCodeHookSpecification: {
          successResponse: undefined,
          successNextStep: {
            dialogAction: {
              type: 'EndConversation',
            }
          },
          timeoutNextStep: {
            dialogAction: {
              type: 'EndConversation',
            }
          },
          failureNextStep: {
            dialogAction: {
              type: 'EndConversation',
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

  const kendraSearchIntent: lex.CfnBot.IntentProperty = {
    name: 'KendraSearchIntent',
    parentIntentSignature: 'AMAZON.KendraSearchIntent',
    kendraConfiguration: {
      kendraIndex: kendraIndex.attrArn,
      queryFilterStringEnabled: false
    },
    fulfillmentCodeHook: {
      isActive: true,
      enabled: false,
      postFulfillmentStatusSpecification: {
        successResponse: {
          messageGroupsList: [
            {
              message: {
                plainTextMessage: {
                  value: '((x-amz-lex:kendra-search-response-question_answer-answer-1))',
                },
              },
            },
          ],
          allowInterrupt: true,
        },
        successNextStep: {
          dialogAction: {
            type: 'EndConversation',
          },
        },
        timeoutNextStep: {
          dialogAction: {
            type: 'EndConversation',
          },
        },
        failureResponse: {
          messageGroupsList: [
            {
              message: {
                plainTextMessage: {
                  value: 'I am sorry, I could not find the answer to your question. Please try again later.',
                },
              },
            },
          ],
          allowInterrupt: true,
        },
        failureNextStep: {
          dialogAction: {
            type: 'EndConversation',
          },
        },
      }
    }
  }

  const botRequiredIntent: lex.CfnBot.IntentProperty = {
    name: 'RequiredIntent',
    sampleUtterances: [
      {
        utterance: 'Required utterance',
      },
    ],
    intentClosingSetting: {
      isActive: true,
      nextStep: {
        dialogAction: {
          type: "StartIntent",
          suppressNextMessage: true
        },
        intent: {
          name: kendraSearchIntent.name,
        }
      }
    },
    initialResponseSetting: {
      codeHook: {
        isActive: true,
        enableCodeHookInvocation: true,
        postCodeHookSpecification: {
          successNextStep: {
            dialogAction: {
              type: 'FulfillIntent',
            }
          },
          timeoutNextStep: {
            dialogAction: {
              type: 'EndConversation'
            }
          },
          failureNextStep: {
            dialogAction: {
              type: 'EndConversation',
            }
          }
        },
      },
      nextStep: {
        dialogAction: {
          type: 'InvokeDialogCodeHook',
        }
      }
    },
    fulfillmentCodeHook: {
      isActive: true,
      enabled: false,
      postFulfillmentStatusSpecification: {
        successResponse: {
          messageGroupsList: [
            {
              message: {
                plainTextMessage: {
                  value: 'Ok'
                }
              }
            }
          ],
          allowInterrupt: true
        },
        successNextStep: {
          dialogAction: {
            type: 'EndConversation',
          }
        },
        timeoutNextStep: {
          dialogAction: {
            type: 'EndConversation',
          }
        },
        failureNextStep: {
          dialogAction: {
            type: 'EndConversation',
          }
        }
      },
    },
    slotPriorities: [],
  };

  const botENUSLocale: lex.CfnBot.BotLocaleProperty =
  {
    localeId: 'en_US',
    nluConfidenceThreshold: 0.4,
    voiceSettings: {
      voiceId: 'Danielle',
      engine: 'neural',
    },
    intents: [
      botFallbackIntent,
      kendraSearchIntent,
      botRequiredIntent,
    ]
  };
  const lexBotRoleArn = createLexBotRoleArn.bind(this)(kendraIndex);

  const lexBot = new lex.CfnBot(this, config.LEX_BOT_NAME, {
    name: config.LEX_BOT_NAME,
    description: 'A bot to answer frequently asked questions',
    dataPrivacy: {
      ChildDirected: false,
    },
    roleArn: lexBotRoleArn.roleArn,
    botLocales: [botENUSLocale],
    idleSessionTtlInSeconds: 300,
  });

  return lexBot;
}

function createLexBotRoleArn(
  this: cdk.Stack,
  kendraIndex: kendra.CfnIndex,
): iam.Role {
  const lexBotRole = new iam.Role(this, 'FAQLexBotRole', {
    assumedBy: new iam.ServicePrincipal('lex.amazonaws.com'),
  });

  lexBotRole.addToPolicy(
    new iam.PolicyStatement({
      actions: [
        'kendra:Query',
        'kendra:Retrieve'
      ],
      resources: [kendraIndex.roleArn],
    })
  );

  lexBotRole.addToPolicy(
    new iam.PolicyStatement({
      actions: [
        'polly:SynthesizeSpeech'
      ],
      resources: ['*'],
    }),
  );

  return lexBotRole;
}
