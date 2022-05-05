import { AzureFunction, Context } from '@azure/functions';

const timerTrigger: AzureFunction = async function (
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  myTimer: any,
): Promise<void> {
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log('Timer function is running late!');
  }
  context.log('Timer trigger function ran!', timeStamp);
};

export default timerTrigger;
