# RelayCore Amazon Kiro IDE Plugin

The RelayCore Amazon Kiro IDE plugin integrates powerful AI capabilities directly into Amazon's Kiro IDE, enhancing your AWS development experience with intelligent code assistance, generation, and optimization specifically tailored for AWS services.

## Features

- **AWS-Specific Code Generation**: Generate code for AWS services like Lambda, S3, DynamoDB, and more
- **CloudFormation Template Generation**: Create and optimize CloudFormation templates using natural language
- **IAM Policy Generation**: Generate secure IAM policies based on natural language descriptions
- **Code Explanation**: Get detailed explanations of AWS-related code
- **Best Practices Enforcement**: Ensure your AWS code follows best practices and security guidelines
- **Documentation Generation**: Automatically generate documentation for your AWS resources
- **Cost Optimization Suggestions**: Get suggestions for optimizing AWS resource costs
- **Security Analysis**: Identify potential security issues in your AWS configurations
- **Serverless Application Development**: Get assistance with AWS Lambda, API Gateway, and other serverless services
- **Contextual Assistance**: Get AI assistance that understands your AWS project context

## Installation

### From Amazon Kiro Marketplace

1. Open Amazon Kiro IDE
2. Go to Extensions
3. Search for "RelayCore"
4. Click "Install"
5. Restart Kiro when prompted

### Manual Installation

1. Download the plugin ZIP file from the [releases page](https://github.com/relaycore/amazon-kiro-plugin/releases)
2. Open Amazon Kiro IDE
3. Go to Extensions
4. Click "Install from VSIX..."
5. Choose the downloaded ZIP file
6. Restart Kiro when prompted

## Setup

After installation, you'll need to configure the plugin with your RelayCore API key:

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on macOS)
2. Type "RelayCore: Configure API Key" and select it
3. Enter your API key when prompted
4. (Optional) Configure the RelayCore endpoint if you're using a self-hosted instance

## Usage

### AWS Code Generation

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on macOS)
2. Type "RelayCore: Generate AWS Code" and select it
3. Enter a description of the AWS functionality you want to implement
4. Select the AWS service and language
5. The generated code will be inserted at the cursor position

Example prompt:
```
Create an AWS Lambda function that processes images uploaded to an S3 bucket, resizes them, and saves the resized versions back to another bucket
```

### CloudFormation Template Generation

1. Open the Command Palette
2. Type "RelayCore: Generate CloudFormation Template" and select it
3. Enter a description of the infrastructure you want to create
4. The generated CloudFormation template will be inserted at the cursor position or opened in a new file

Example prompt:
```
Create a CloudFormation template for a serverless web application with API Gateway, Lambda, DynamoDB, and S3 for static hosting
```

### IAM Policy Generation

1. Open the Command Palette
2. Type "RelayCore: Generate IAM Policy" and select it
3. Enter a description of the permissions needed
4. The generated IAM policy will be inserted at the cursor position

Example prompt:
```
Create an IAM policy that allows read-only access to specific S3 buckets and DynamoDB tables
```

### Code Explanation

1. Select the code you want to explain
2. Right-click and select "RelayCore: Explain AWS Code" or use the Command Palette
3. The explanation will appear in the RelayCore panel

### Best Practices Analysis

1. Select the code or CloudFormation template you want to analyze
2. Open the Command Palette
3. Type "RelayCore: Check AWS Best Practices" and select it
4. The analysis results will appear in the RelayCore panel

### Cost Optimization

1. Select your CloudFormation template or AWS resource definitions
2. Open the Command Palette
3. Type "RelayCore: Optimize AWS Costs" and select it
4. Cost optimization suggestions will appear in the RelayCore panel

### Security Analysis

1. Select your CloudFormation template or IAM policies
2. Open the Command Palette
3. Type "RelayCore: Analyze AWS Security" and select it
4. Security analysis results will appear in the RelayCore panel

## RelayCore Panel

The RelayCore panel provides a central interface for interacting with the plugin:

1. Open the panel by clicking on the RelayCore icon in the activity bar or using the Command Palette
2. The panel has several tabs:
   - **Chat**: Have a conversation with the AI about your AWS resources
   - **Generate**: Generate AWS code and resources
   - **Explain**: Get explanations of selected AWS code
   - **Analyze**: Analyze your AWS resources for best practices, cost, and security
   - **History**: View your previous interactions with the AI

## AWS Service Support

The RelayCore Amazon Kiro plugin provides specialized support for the following AWS services:

- **Compute**: EC2, Lambda, ECS, EKS, Fargate, Batch
- **Storage**: S3, EBS, EFS, FSx
- **Database**: DynamoDB, RDS, Aurora, ElastiCache, Neptune, Redshift
- **Networking**: VPC, Route 53, CloudFront, API Gateway, AppSync
- **Security**: IAM, Cognito, KMS, WAF, Shield, GuardDuty
- **Integration**: SQS, SNS, EventBridge, Step Functions
- **Monitoring**: CloudWatch, X-Ray, CloudTrail
- **Developer Tools**: CodeBuild, CodeDeploy, CodePipeline, CodeCommit
- **Serverless**: Lambda, API Gateway, DynamoDB, S3, SQS, SNS, EventBridge

## Configuration Options

The RelayCore Amazon Kiro plugin offers several configuration options:

- **API Key**: Your RelayCore API key
- **Endpoint**: The RelayCore API endpoint (default: `https://api.relaycore.ai`)
- **Model**: The AI model to use (default: `gpt-4`)
- **Temperature**: The creativity level of the AI (0.0-1.0)
- **Max Tokens**: Maximum response length
- **Context Size**: How much project context to include in requests
- **AWS Region**: Default AWS region for generated code
- **AWS Profile**: Default AWS profile for generated code
- **CloudFormation Format**: YAML or JSON format for CloudFormation templates
- **Code Style**: Your preferred coding style for generated code
- **Documentation Style**: Your preferred documentation style

## Examples

### AWS Lambda Function Example

Prompt:
```
Create an AWS Lambda function in Python that processes messages from an SQS queue, extracts data, and stores it in DynamoDB
```

Generated code:
```python
import json
import boto3
import os
import uuid
from datetime import datetime

# Initialize AWS clients
sqs = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')

# Get environment variables
QUEUE_URL = os.environ['SQS_QUEUE_URL']
TABLE_NAME = os.environ['DYNAMODB_TABLE']

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    """
    Lambda function that processes messages from an SQS queue and stores data in DynamoDB.
    
    Parameters:
    event (dict): The event dict containing the SQS messages
    context (LambdaContext): The Lambda context object
    
    Returns:
    dict: Response with processing results
    """
    # Initialize counters for monitoring
    processed_count = 0
    failed_count = 0
    
    try:
        # Process each record from the SQS event
        for record in event['Records']:
            try:
                # Extract message body
                message_body = record['body']
                message_data = json.loads(message_body)
                
                # Generate a unique ID if not present
                if 'id' not in message_data:
                    message_data['id'] = str(uuid.uuid4())
                
                # Add timestamp
                message_data['processed_at'] = datetime.utcnow().isoformat()
                
                # Store in DynamoDB
                table.put_item(Item=message_data)
                
                processed_count += 1
                
            except Exception as e:
                print(f"Error processing record: {str(e)}")
                print(f"Record: {record}")
                failed_count += 1
                
        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': processed_count,
                'failed': failed_count
            })
        }
        
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
```

### CloudFormation Template Example

Prompt:
```
Create a CloudFormation template for a serverless API with Lambda, API Gateway, and DynamoDB
```

Generated template:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless API with Lambda, API Gateway, and DynamoDB'

Parameters:
  StageName:
    Type: String
    Default: dev
    Description: API Gateway stage name

Resources:
  # DynamoDB Table
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${AWS::StackName}-items
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt DynamoDBTable.Arn

  # Lambda Functions
  GetItemsFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${AWS::StackName}-get-items
      Runtime: nodejs14.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const TABLE_NAME = process.env.TABLE_NAME;
          
          exports.handler = async (event) => {
            try {
              const params = {
                TableName: TABLE_NAME
              };
              
              const result = await dynamodb.scan(params).promise();
              
              return {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(result.Items)
              };
            } catch (error) {
              console.error('Error:', error);
              return {
                statusCode: 500,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Failed to retrieve items' })
              };
            }
          };
      Environment:
        Variables:
          TABLE_NAME: !Ref DynamoDBTable
      Timeout: 10
      MemorySize: 128

  GetItemFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${AWS::StackName}-get-item
      Runtime: nodejs14.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const TABLE_NAME = process.env.TABLE_NAME;
          
          exports.handler = async (event) => {
            try {
              const id = event.pathParameters.id;
              
              const params = {
                TableName: TABLE_NAME,
                Key: { id }
              };
              
              const result = await dynamodb.get(params).promise();
              
              if (!result.Item) {
                return {
                  statusCode: 404,
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  },
                  body: JSON.stringify({ error: 'Item not found' })
                };
              }
              
              return {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(result.Item)
              };
            } catch (error) {
              console.error('Error:', error);
              return {
                statusCode: 500,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Failed to retrieve item' })
              };
            }
          };
      Environment:
        Variables:
          TABLE_NAME: !Ref DynamoDBTable
      Timeout: 10
      MemorySize: 128

  CreateItemFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub ${AWS::StackName}-create-item
      Runtime: nodejs14.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const { v4: uuidv4 } = require('uuid');
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const TABLE_NAME = process.env.TABLE_NAME;
          
          exports.handler = async (event) => {
            try {
              const requestBody = JSON.parse(event.body);
              const timestamp = new Date().toISOString();
              
              const item = {
                id: uuidv4(),
                ...requestBody,
                createdAt: timestamp,
                updatedAt: timestamp
              };
              
              const params = {
                TableName: TABLE_NAME,
                Item: item
              };
              
              await dynamodb.put(params).promise();
              
              return {
                statusCode: 201,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(item)
              };
            } catch (error) {
              console.error('Error:', error);
              return {
                statusCode: 500,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Failed to create item' })
              };
            }
          };
      Environment:
        Variables:
          TABLE_NAME: !Ref DynamoDBTable
      Timeout: 10
      MemorySize: 128

  # API Gateway
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub ${AWS::StackName}-api
      Description: API for serverless application
      EndpointConfiguration:
        Types:
          - REGIONAL

  # API Resources and Methods
  ItemsResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: items

  GetItemsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ItemsResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GetItemsFunction.Arn}/invocations

  CreateItemMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ItemsResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${CreateItemFunction.Arn}/invocations

  ItemResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !Ref ItemsResource
      PathPart: '{id}'

  GetItemMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ItemResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GetItemFunction.Arn}/invocations

  # API Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - GetItemsMethod
      - GetItemMethod
      - CreateItemMethod
    Properties:
      RestApiId: !Ref ApiGateway
      StageName: !Ref StageName

  # Lambda Permissions
  GetItemsPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref GetItemsFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/${StageName}/GET/items

  GetItemPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref GetItemFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/${StageName}/GET/items/{id}

  CreateItemPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref CreateItemFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/${StageName}/POST/items

Outputs:
  ApiUrl:
    Description: URL of the API Gateway
    Value: !Sub https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${StageName}/
  GetItemsUrl:
    Description: URL to get all items
    Value: !Sub https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${StageName}/items
  CreateItemUrl:
    Description: URL to create a new item
    Value: !Sub https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${StageName}/items
  GetItemUrlExample:
    Description: Example URL to get a specific item (replace {id} with actual ID)
    Value: !Sub https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${StageName}/items/{id}
  DynamoDBTableName:
    Description: Name of the DynamoDB table
    Value: !Ref DynamoDBTable
```

### IAM Policy Example

Prompt:
```
Create an IAM policy that allows read-only access to S3 buckets with prefix 'data-' and CloudWatch logs
```

Generated policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ReadOnlyAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetObjectAcl",
        "s3:GetObjectTagging",
        "s3:GetObjectVersionTagging",
        "s3:GetObjectTorrent",
        "s3:GetObjectVersionTorrent",
        "s3:ListBucket",
        "s3:ListBucketVersions",
        "s3:ListBucketMultipartUploads",
        "s3:ListMultipartUploadParts",
        "s3:GetBucketLocation",
        "s3:GetBucketVersioning",
        "s3:GetBucketAcl",
        "s3:GetBucketCORS",
        "s3:GetBucketWebsite",
        "s3:GetBucketLogging",
        "s3:GetBucketNotification",
        "s3:GetBucketPolicy",
        "s3:GetBucketRequestPayment",
        "s3:GetBucketTagging",
        "s3:GetLifecycleConfiguration",
        "s3:GetReplicationConfiguration"
      ],
      "Resource": [
        "arn:aws:s3:::data-*",
        "arn:aws:s3:::data-*/*"
      ]
    },
    {
      "Sid": "CloudWatchLogsReadOnlyAccess",
      "Effect": "Allow",
      "Action": [
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents",
        "logs:FilterLogEvents",
        "logs:GetLogRecord",
        "logs:GetLogGroupFields",
        "logs:GetQueryResults",
        "logs:StartQuery",
        "logs:StopQuery",
        "logs:TestMetricFilter",
        "logs:DescribeMetricFilters",
        "logs:DescribeSubscriptionFilters"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3ListAllBuckets",
      "Effect": "Allow",
      "Action": "s3:ListAllMyBuckets",
      "Resource": "*"
    }
  ]
}
```

## Troubleshooting

### Common Issues

- **Authentication Failed**: Verify your API key in the settings
- **Plugin Not Responding**: Try reloading Kiro IDE
- **Request Timeout**: Try reducing the context size or splitting your request into smaller chunks
- **Rate Limiting**: You may have exceeded your API usage limits
- **AWS Credentials**: Ensure your AWS credentials are properly configured if you're using AWS SDK features

### Logs

To access the plugin logs:

1. Open the Command Palette
2. Type "Developer: Open Logs Folder" and select it
3. Look for the `relaycore-kiro.log` file

## Support

If you encounter any issues or have questions about the RelayCore Amazon Kiro plugin, please:

- Check the [FAQ](https://docs.relaycore.ai/plugins/amazon-kiro/faq)
- Join our [Discord community](https://discord.gg/relaycore)
- Open an issue on our [GitHub repository](https://github.com/relaycore/amazon-kiro-plugin/issues)
- Contact support at support@relaycore.ai

## Privacy and Security

The RelayCore Amazon Kiro plugin sends code snippets and context to the RelayCore API for processing. We take privacy and security seriously:

- All data is encrypted in transit
- We do not store your code permanently
- You can configure how much context is sent with each request
- You can use a self-hosted RelayCore instance for complete data control
- We never store or access your AWS credentials

For more information, see our [Privacy Policy](https://relaycore.ai/privacy).