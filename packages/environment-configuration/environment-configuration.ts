
export type EnvironmentVariables<T extends EnvironmentConfiguration> = {
  [key in keyof T]: string;
};

export interface EnvironmentConfiguration {
  [key: string]: {
    constraint: 'required' | 'optional';
    default?: string;
  }
}