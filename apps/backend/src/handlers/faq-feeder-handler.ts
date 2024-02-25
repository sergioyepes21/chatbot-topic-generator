import { APIGatewayEvent, APIGatewayProxyResultV2 } from "aws-lambda";
import { OpenAIClient } from "../ai-text-client/open-ai-client/open-ai-client";
import { AWSKendraClient } from "../ai-faq-client/aws-kendra-client/aws-kendra-client";
import { AWSS3StorageClient, } from "../storage-client/aws-s3-storage-client/aws-s3-storage-client";
import { AITextClientDefaultResponse } from "../ai-text-client/ai-text-client";
import { loadEnvironmentVariables } from "@chatbot-topic/environment-configuration";

interface FAQFeederEventBody {
  topic: string;
  minQuestions: string;
  content?: string;
}

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
  INDEX_ID: {
    constraint: 'required',
  },
});

const aiTextClient = new OpenAIClient();
const aiFaqClient = new AWSKendraClient();
const storageClient = new AWSS3StorageClient();

const bucketName = config.S3_BUCKET_NAME;
const bucketKey = (topic: string) => `faq/${topic}.csv`;

const faqRoleArn = config.FAQ_ROLE_ARN;
const indexId = config.INDEX_ID;

export async function faqFeederHander(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResultV2> {
  const body = parseBody(event);

  const fileContent = body.content ?? await buildCSV(body);
  console.log(`fileContent:`, fileContent);

  const key = await uploadCSVFile(fileContent, body.topic);
  await addFAQUtterances(body.topic, key);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `FAQ for '${body.topic}' has been created`,
      questions: fileContent,
    })
  };
}

function parseBody(
  event: APIGatewayEvent
): FAQFeederEventBody {
  if (!event.body) throw new Error('No body provided');
  const body = JSON.parse(event.body);

  if (!body.topic) throw new Error('No topic provided');
  else if (!body.minQuestions) throw new Error('No minQuestions provided');

  return body;
}

async function buildCSV(
  b: FAQFeederEventBody,
): Promise<string> {
  try {
    const prompt = buildPromt(b);
    const questions = await aiTextClient.getAnswer(prompt);

    if (questions === AITextClientDefaultResponse.NO_ANSWER || questions === AITextClientDefaultResponse.ERROR) {
      throw new Error(questions);
    }
    return questions;
  } catch (e) {
    console.error(e);
    throw new Error(`Error building CSV: ${e}`);
  }
}

function buildPromt(
  {
    topic,
    minQuestions
  }: FAQFeederEventBody
): string {
  return `You are interested in creating a FAQ for: "${topic}".
  The output format is a CSV file where each cell is wrapped inside double quoutes.
  The headers should be: "_question", "_answer".
  The number of questions is: ${minQuestions}.`
}

async function uploadCSVFile(
  fileContent: string,
  topic: string
): Promise<string> {
  const key = bucketKey(topic);
  try {
    await storageClient.uploadFile({
      bucketName,
      key,
      contentType: 'text/csv',
      file: Buffer.from(fileContent, 'utf-8'),
    });
    return key;
  } catch (e) {
    console.error(e);
    throw new Error(`Error uploading CSV file: ${e}`);
  }
}

async function addFAQUtterances(
  topic: string,
  key: string
): Promise<void> {
  try {
    const faqUtteranceName = topic.toLowerCase().replace(/ /g, '-');
    console.log(`faqUtteranceName:`, faqUtteranceName);
    await aiFaqClient.addFAQUtterances({
      name: faqUtteranceName,
      extraArgs: {
        bucket: bucketName,
        faqRoleArn,
        indexId: indexId,
        key,
      }
    })
  } catch (e) {
    console.error(e);
    throw new Error(`Error adding FAQ utterances: ${e}`);
  }
}