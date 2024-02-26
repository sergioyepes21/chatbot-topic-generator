# Chatbot Topic Generator FRepository README

Welcome to the Turbo Repository! This mono repository is designed to efficiently generate and manage frequently asked questions (FAQs) using OpenAI GPT-3.5-turbo, AWS services, and TypeScript. The repository consists of two main apps: backend and infrastructure, along with an internal package for environment configuration.

The following cloud architecture illustrates a high-level flow:

![Cloud Architecture](./assets/Cloud%20Architecture.jpg)

## Repository Structure

### 1. Backend App

- **Language:** Node.js, TypeScript
- **Functionality:**
  - Utilizes AWS Lambda to generate FAQs using OpenAI GPT-3.5-turbo.
  - Abstracts integrations with OpenAI, AWS S3, and AWS Kendra using generic interfaces.
  - Generates CSV format FAQs, loads it to AWS S3, and creates an AWS Kendra FAQ with the CSV file as the source.

### 2. Infrastructure App

![Cloud Architecture](./assets/AWS%20Architecture.drawio.png)

- **Language:** Node.js, TypeScript, AWS CDK
- **AWS Resources Created:**
  - 1 AWS S3 Bucket (receives its bucket name as an environment variable).
  - 1 AWS Kendra index (receives its ARN Role as an environment variable).
  - 1 AWS Lex Bot (receives its ARN Role as an environment variable).
  - 1 HTTP API Gateway.
  - 1 AWS Lambda with the handler described in the Backend App.
  - 1 HTTP Lambda Integration between the API Gateway and the Lambda.

### 3. Internal Environment-Configuration Package

- **Language:** Node.js, TypeScript
- **Functionality:**
  - Reads environment configuration from process.env using a provided configuration object.
  - Handles required or optional variables and supports default values.

## Getting Started

### ⚠️  Prerequisites

1. Node.js and npm installed.
2. [Turbo](https://turbo.build/repo/docs/installing) Node.js package globally installed

### Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/sergioyepes21/chatbot-topic-generator.git
    cd chatbot-topic-generator
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

## Deploy

1. Deploy the services:

    ```bash
    npm run deploy
    ```

## Locally Running the Apps

The AWS SAM CLI locally deploys on Docker the required API Gateway and AWS Lambda so you can test.

**⚠️ Prerequisites**:  You should have deployed the infrastructure at least once, so that the S3 Bucket and the AWS Kendra index exist when the Lambda code is executed.

1. Install the [Docker Engine](https://docs.docker.com/engine/install/)
2. Install the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
3. Fill the `.env` file from the `infra` application with the required values 
4. Run the infrastructure locally:

    ```bash
    npm run dev
    ```

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'Add your feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a pull request.

## Issues

If you encounter any issues or have suggestions for improvements, please open an issue.

## License

This repository is licensed under the [MIT License](LICENSE).
