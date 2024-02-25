import { CdkCustomResourceEvent } from "aws-lambda";
import {
  LexModelsV2Client,
  CreateBotCommand, CreateIntentCommand, CreateBotLocaleCommand, CreateSlotCommand, DeleteBotCommand, DescribeBotCommand,
  BotStatus,
  ConflictException,
  ValidationException,
  LexModelsV2ServiceException
} from "@aws-sdk/client-lex-models-v2";
import { setTimeout } from "timers/promises";

const lexModelClient = new LexModelsV2Client({});

export async function handler(
  event: CdkCustomResourceEvent
): Promise<void> {
  console.log(`event:`, JSON.stringify(event, null, 2));
  const {
    RequestType,
  } = event;

  switch (RequestType) {
    case 'Create':
      await onLexBotCreateEvent(event);
      break;
    case 'Update':
      await onLexBotUpdateEvent(event);
      break;
    case 'Delete':
      await onLexBotDeleteEvent(event);
      break;
  }
}

async function onLexBotCreateEvent(
  event: CdkCustomResourceEvent
): Promise<void> {

  const botVersion = "DRAFT";
  const localeId = event.ResourceProperties.Locale;

  const botId = await createLexBot(event);

  const createBotLocale = await lexModelClient.send(new CreateBotLocaleCommand({
    botId: botId,
    botVersion,
    localeId: localeId,
    nluIntentConfidenceThreshold: 0.4,
    description: 'A locale for the bot',
    voiceSettings: {
      voiceId: 'Danielle',
      engine: 'neural',
    }
  })).catch(e => {
    console.log(`CreateBotLocaleCommand:`, e);
    throw e;
  });
  console.log(`createBotLocale:`, JSON.stringify(createBotLocale, null, 2));

  const createFallbackIntentOutput = await lexModelClient.send(new CreateIntentCommand({
    botId: botId,
    botVersion,
    intentName: 'FallbackIntent',
    localeId: localeId,
    sampleUtterances: [
      {
        utterance: 'I don\'t know',
      },
      {
        utterance: 'I don\'t understand'
      }
    ],
    description: 'Fallback intent for when the bot doesn\'t understand the user input',
    intentConfirmationSetting: undefined,
    initialResponseSetting: {
      codeHook: {
        active: true,
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
    },
  })).catch(e => {
    console.log(`CreateIntentCommand:`, e);
    throw e;
  });
  console.log(`createFallbackIntentOutput:`, JSON.stringify(createFallbackIntentOutput, null, 2));

  const createGreetingIntentOutput = await lexModelClient.send(new CreateIntentCommand({
    botId: botId,
    botVersion,
    intentName: 'GreetingIntent',
    localeId: createBotLocale.localeId,
    sampleUtterances: [
      {
        utterance: 'Hello',
      },
      {
        utterance: 'Hi, my name is {Name}'
      }
    ],
    description: 'Greet the user and get to know their name',
    intentConfirmationSetting: undefined,
    initialResponseSetting: {
      codeHook: {
        active: true,
        enableCodeHookInvocation: true,
        postCodeHookSpecification: {
          successResponse: undefined,
          successNextStep: {
            dialogAction: {
              type: 'ElicitSlot',
              slotToElicit: 'Name',
            }
          },
          timeoutNextStep: {
            dialogAction: {
              type: 'EndConversation',
            },
          },
          failureNextStep: {
            dialogAction: {
              type: 'EndConversation',
            },
          }
        }
      },
      nextStep: {
        dialogAction: {
          type: 'InvokeDialogCodeHook',
        }
      }
    },
  })).catch(e => {
    console.log(`CreateIntentCommand:`, e);
    throw e;
  });
  console.log(`createGreetingIntentOutput:`, JSON.stringify(createGreetingIntentOutput, null, 2));

  const createSlotOutput = await lexModelClient.send(new CreateSlotCommand({
    botId: botId,
    botVersion,
    intentId: createGreetingIntentOutput.intentId,
    localeId: createBotLocale.localeId,
    slotName: 'Name',
    slotTypeId: 'AMAZON.FirstName',
    valueElicitationSetting: {
      slotCaptureSetting: {
        captureNextStep: {
          dialogAction: {
            type: 'CloseIntent',
          }
        },
        failureNextStep: {
          dialogAction: {
            type: 'StartIntent',
          },
          intent: {
            name: createFallbackIntentOutput.intentName,
          }
        }
      },
      promptSpecification: {
        messageGroups: [
          {
            message: {
              plainTextMessage: {
                value: 'What is your name?'
              }
            }
          }
        ],
        maxRetries: 2,
        allowInterrupt: true,
        messageSelectionStrategy: 'Random',
        promptAttemptsSpecification: {
          Initial: {
            allowedInputTypes: {
              allowAudioInput: false,
              allowDTMFInput: false,
            },
            allowInterrupt: true,
            textInputSpecification: {
              startTimeoutMs: 30000,
            }
          },
          Retry1: {
            allowedInputTypes: {
              allowAudioInput: false,
              allowDTMFInput: false,
            },
            allowInterrupt: true,
            textInputSpecification: {
              startTimeoutMs: 30000,
            }
          },
          Retry2: {
            allowedInputTypes: {
              allowAudioInput: false,
              allowDTMFInput: false,
            },
            allowInterrupt: true,
            textInputSpecification: {
              startTimeoutMs: 30000,
            }
          },
        }
      },
      slotConstraint: 'Required',
    }
  })).catch(e => {
    console.log(`CreateSlotCommand:`, e);
    throw e;
  });
  console.log(`createSlotOutput:`, JSON.stringify(createSlotOutput, null, 2));

}

async function createLexBot(
  {
    LogicalResourceId,
    ResourceProperties: {
      ChildDirected,
      BotRoleArn
    }
  }: CdkCustomResourceEvent
): Promise<string> {
  try {
    const createBotOutput = await lexModelClient.send(new CreateBotCommand({
      botName: LogicalResourceId,
      dataPrivacy: {
        childDirected: ChildDirected,
      },
      idleSessionTTLInSeconds: 60,
      roleArn: undefined,
      // roleArn: BotRoleArn,
    }))
    console.log(`createBotOutput:`, JSON.stringify(createBotOutput, null, 2));

    let botStatus = createBotOutput.botStatus;

    while (botStatus === BotStatus.Creating) {
      console.info(`Bot status: ${botStatus} - waiting for bot to be created...`);
      await setTimeout(1000);
      const describeBotOutput = await lexModelClient.send(new DescribeBotCommand({
        botId: createBotOutput.botId,
      }));
      botStatus = describeBotOutput.botStatus;
    }

    return createBotOutput.botId!;
  } catch (e: unknown) {
    console.log(`createLexBot:`, e);
    throw e;
  }
}


async function onLexBotDeleteEvent(
  {
    LogicalResourceId,
  }: CdkCustomResourceEvent
): Promise<void> {
  const deleteBotOutput = await lexModelClient.send(new DeleteBotCommand({
    botId: LogicalResourceId,
  }));
  console.log(`deleteBotOutput:`, JSON.stringify(deleteBotOutput, null, 2));
}

async function onLexBotUpdateEvent(
  {
    LogicalResourceId,
  }: CdkCustomResourceEvent
): Promise<void> {
  console.log('onLexBotUpdateEvent: ' + LogicalResourceId);
}

function handleLexCommandError(error: unknown) {
  if (!(error instanceof LexModelsV2ServiceException)) {
    console.log(`Unknown error:`, error);
    return;
  }

  switch (error.constructor) {
    case ConflictException:
      console.log(`ConflictException:`, error.message);
      break;
  }

}