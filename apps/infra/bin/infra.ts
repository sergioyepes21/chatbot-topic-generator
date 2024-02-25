#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ChatBotInfraStack } from '../lib/infra-stack';

const app = new cdk.App();
new ChatBotInfraStack(app, 'ChatBotInfraStack', {
});