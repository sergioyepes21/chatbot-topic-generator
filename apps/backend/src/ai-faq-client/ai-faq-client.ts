
type SupportedAIFAQClient = 'kendra';

export type AddFAQUterancesInputExtraArgs<T extends SupportedAIFAQClient> =
  T extends 'kendra' ? {
    indexId: string;
    bucket: string;
    key: string;
    faqRoleArn: string;
  } : {};

export interface AddFAQUterancesInput<T extends SupportedAIFAQClient> {
  name: string;
  extraArgs: AddFAQUterancesInputExtraArgs<T>;
}

export interface AIFAQClient<T extends SupportedAIFAQClient> {
  addFAQUtterances(i: AddFAQUterancesInput<T>): Promise<void>;
}