#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SharedInfraStack } from '../lib/shared-infra-stack';
import accounts from '../lib/accounts.json';

const app = new cdk.App();

function createDevStack() {
  const { ACCOUNT_ID } = process.env;
  if(ACCOUNT_ID) {
    new SharedInfraStack(app, `SharedInfra-${ACCOUNT_ID}-us-west-1`, {
      stage: 'alpha',
      env: {
        account: ACCOUNT_ID,
        region: 'us-west-1'
      }
    })
  }
}

createDevStack();

for(const acc of accounts) {
  new SharedInfraStack(app, `SharedInfra-${acc.accountId}-${acc.region}`, {
    stage: acc.stage,
    env: {
      account: acc.accountId,
      region: acc.region
    }
  });
}
