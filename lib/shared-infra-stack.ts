import * as cdk from '@aws-cdk/core';

import * as cognito from '@aws-cdk/aws-cognito';
import { countResources } from '@aws-cdk/assert';

export interface SharedInfraProps extends cdk.StackProps {
  stage?: string;
}

function getCognitoDomain(stage: string, account: string): string {
  if(stage === 'alpha') return `vicci-dev-${account}`;
  if(stage === 'beta') return `vicci-dev`;
  if(stage === 'gamma') return `vicci-gamma`
  return 'vicci';
}
/**
 * Things held in this stack: 
 * 1. AppConfig Application, Environment, configuration, and deployment.
 * 2. Cognito User Pool and Access Client, information stored in the 
 */
export class SharedInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: SharedInfraProps) {
    super(scope, id, props);
    const { stage = 'alpha' } = props;
    const userPool = new cognito.UserPool(this, `UserPool-${stage}`, {
      userPoolName: `UserPool-${stage}`,
      selfSignUpEnabled: true,
      standardAttributes: {
        email: { required: true, mutable: true },
        phoneNumber: { required: false },
        preferredUsername: { required: true } 
      },
      autoVerify: {
        // Makes it so that the alpha/beta stages don't auto-verify.
        email: ['gamma', 'prod'].includes(stage)
      },
      passwordPolicy: {
        minLength: 6,
        requireSymbols: true,
        requireUppercase: true
      }
    });

    const userPoolDomain = new cognito.UserPoolDomain(this, `Vicci-UserDomain-${stage}`, {
      userPool,
      cognitoDomain: {
        domainPrefix: getCognitoDomain(stage, props.env?.account || '')
      }
    });

    let userPoolClient: cognito.UserPoolClient;

    userPoolClient = userPool.addClient('local-dev', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true
        },
        callbackUrls: [
          'https://localhost:8080/callback'
        ],
        logoutUrls: [
          'https://localhost:8080/signout'
        ]
      },
    });
  
    new cdk.CfnOutput(this, 'UserPool', {
      exportName: 'UserPoolId',
      value: userPool.userPoolId,
      description: 'The User Pool ID for this region.'
    });

    new cdk.CfnOutput(this, 'UserPoolClient', {
      exportName: 'UserPoolClientId',
      value: userPoolClient.userPoolClientId
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      exportName: 'UserPoolDomain',
      value: userPoolDomain.baseUrl()
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      exportName: 'UserPoolArn',
      value: userPool.userPoolArn
    });

  }
}
