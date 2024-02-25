import "dotenv/config";
import { EnvironmentConfiguration, EnvironmentVariables } from "./environment-configuration";

export function loadEnvironmentVariables<T extends EnvironmentConfiguration>(
  envConfig: T
): EnvironmentVariables<T> {
  const environmentVariables = {} as EnvironmentVariables<T>;

  for (const key in envConfig) {
    const { constraint, default: defaultValue } = envConfig[key];

    const value = process.env[key] ?? defaultValue;

    if (constraint === 'required' && !value) {
      throw new Error(`Environment variable ${key} is required`);
    }

    environmentVariables[key as keyof T] = value!;
  }

  return environmentVariables;
}