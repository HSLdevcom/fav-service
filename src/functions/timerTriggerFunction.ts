import { app, InvocationContext, Timer } from '@azure/functions';

export async function timerTrigger(
  myTimer: Timer,
  context: InvocationContext,
): Promise<void> {
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log('Timer function is running late!');
  }
  context.log('Timer trigger function ran!', timeStamp);
}

app.timer('myTimer', {
  schedule: '0 */2 * * * *',
  handler: timerTrigger,
});
