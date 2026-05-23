import crypto from 'crypto';

export const generateCCBillPaymentUrl = (amount: number, userId: string = 'temp-user-id') => {
  const subAccount = process.env.CCBILL_SUBACCOUNT || '';
  const formName = process.env.CCBILL_FORM_NAME || '';
  const salt = process.env.CCBILL_SALT || '';

  // CCBill standard parameters for one-time charge
  const params = new URLSearchParams({
    clientAccnum: process.env.CCBILL_CLIENT_ACCNUM || '',
    initialPeriod: '1',
    initialPeriodAmount: amount.toString(),
    initialPeriodIsRecurring: '0',
    currencyCode: '840', // USD
    formName: formName,
    subAccount: subAccount,
    // Custom fields for our system
    'x-userId': userId,
    'x-credits': amount.toString()
  });

  const url = \https://secure.ccbill.com/jpost/signup.cgi?\\;
  return url;
};

export const verifyCCBillSignature = (postData: any): boolean => {
  const salt = process.env.CCBILL_SALT || '';
  const signature = postData.signature || '';
  const subscriptionId = postData.subscriptionId || postData.transactionId || '';

  const stringToHash = subscriptionId + salt;
  const hash = crypto.createHash('md5').update(stringToHash).digest('hex');

  return hash.toLowerCase() === signature.toLowerCase();
};
