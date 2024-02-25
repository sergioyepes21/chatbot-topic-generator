# Turbo-Repository README

Welcome to the Turbo Repository! This mono repository is designed to efficiently generate and manage frequently asked questions (FAQs) using OpenAI GPT-3.5-turbo, AWS services, and TypeScript. The repository consists of two main apps: backend and infrastructure, along with an internal package for environment configuration.

## Repository Structure

### 1. Backend App

- **Language:** Node.js, TypeScript
- **Functionality:**
  - Utilizes AWS Lambda to generate FAQs using OpenAI GPT-3.5-turbo.
  - Abstracts integrations with OpenAI, AWS S3, and AWS Kendra using generic interfaces.
  - Generates CSV format FAQs, loads it to AWS S3, and creates an AWS Kendra FAQ with the CSV file as the source.

### 2. Infrastructure App

- **Language:** Node.js, TypeScript, AWS CDK
- **AWS Resources Created:**
  - 1 AWS S3 Bucket (receives its bucket name as an environment variable).
  - 1 AWS Kendra index (receives its ARN Role as an environment variable).
  - 1 HTTP API Gateway.
  - 1 AWS Lambda with the handler described in the Backend App.
  - 1 HTTP Lambda Integration between the API Gateway and the Lambda.

### 3. Internal Environment-Configuration Package

- **Language:** Node.js, TypeScript
- **Functionality:**
  - Reads environment configuration from process.env using a provided configuration object.
  - Handles required or optional variables and supports default values.

## Getting Started

### Prerequisites

1. Node.js and npm installed.
2. AWS CLI configured with necessary credentials.

### Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/turbo-repository.git
    cd turbo-repository
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Navigate to the `backend` and `infrastructure` directories, and follow the README instructions for each app to set up the required environment variables and deploy AWS resources.

## Running the Apps

- Follow the instructions in each app's README to run and test the applications.

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'Add your feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a pull request.

## Issues

If you encounter any issues or have suggestions for improvements, please [open an issue](https://github.com/your-username/turbo-repository/issues).

## License

This repository is licensed under the [MIT License](LICENSE).
