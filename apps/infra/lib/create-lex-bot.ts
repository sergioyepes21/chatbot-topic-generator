import * as cdk from 'aws-cdk-lib';
import * as kendra from 'aws-cdk-lib/aws-kendra';
import * as lex from 'aws-cdk-lib/aws-lex';
import { loadEnvironmentVariables } from '@chatbot-topic/environment-configuration';


const config = loadEnvironmentVariables({
  LEX_BOT_NAME: {
    constraint: 'required',
  },
  LEX_BOT_ROLE_ARN: {
    constraint: 'required',
  },
});

export function createLexBot(
  this: cdk.Stack,
  kendraIndex: kendra.CfnIndex,
): lex.CfnBot {

  const botFallbackIntent: lex.CfnBot.IntentProperty = {
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

  const kendraSearchIntent: lex.CfnBot.IntentProperty = {
    name: 'KendraSearchIntent',
    parentIntentSignature: 'AMAZON.KendraSearchIntent',
    kendraConfiguration: {
      kendraIndex: kendraIndex.ref,
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

  const lexBot = new lex.CfnBot(this, config.LEX_BOT_NAME, {
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