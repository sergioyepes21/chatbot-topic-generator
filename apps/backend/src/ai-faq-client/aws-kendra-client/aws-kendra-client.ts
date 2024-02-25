import { AIFAQClient, AddFAQUterancesInput } from "../ai-faq-client";
import { KendraClient, CreateFaqCommand } from "@aws-sdk/client-kendra";
export class AWSKendraClient implements AIFAQClient<'kendra'> {
  private readonly kendraClient: KendraClient;

  constructor() {
    this.kendraClient = new KendraClient({});
  }

  async addFAQUtterances({
    extraArgs: {
      indexId,
      bucket,
      key,
      faqRoleArn,
    },
    name,
  }: AddFAQUterancesInput<'kendra'>): Promise<void> {
    const command = new CreateFaqCommand({
      IndexId: indexId,
      Name: name,
      RoleArn: faqRoleArn!,
      S3Path: {
        Bucket: bucket,
        Key: key
      },
    })

    const createFaqCommandOutput = await this.kendraClient.send(command);
    console.log(`createFaqCommandOutput:`, JSON.stringify(createFaqCommandOutput, null, 2));
  }
}