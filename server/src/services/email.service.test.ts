import assert from 'node:assert/strict';
import test from 'node:test';
import { sendBrevoEmail } from './email.service';

test('Brevo password-reset delivery uses a verified sender and keeps its key in a header', async () => {
  let url = '';
  let init: RequestInit | undefined;
  const fetchFn = (async (target: string | URL | Request, options?: RequestInit) => {
    url = String(target);
    init = options;
    return new Response(JSON.stringify({ messageId: 'synthetic' }), { status: 201 });
  }) as typeof fetch;
  await sendBrevoEmail({
    to: 'recipient@example.org', subject: 'Reset password', html: '<p>Reset</p>',
    from: 'CareerPilot <sender@gmail.com>', apiKey: 'secret-value',
  }, fetchFn);
  assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(init?.method, 'POST');
  assert.equal((init?.headers as Record<string, string>)['api-key'], 'secret-value');
  const body = JSON.parse(String(init?.body));
  assert.deepEqual(body.sender, { name: 'CareerPilot', email: 'sender@gmail.com' });
  assert.deepEqual(body.to, [{ email: 'recipient@example.org' }]);
  assert.equal(JSON.stringify(body).includes('secret-value'), false);
});

test('Brevo failures do not reveal the provider response or API key', async () => {
  const fetchFn = (async () => new Response('private provider detail', { status: 401 })) as typeof fetch;
  await assert.rejects(sendBrevoEmail({
    to: 'recipient@example.org', subject: 'Reset password', html: '<p>Reset</p>',
    from: 'sender@gmail.com', apiKey: 'secret-value',
  }, fetchFn), /^Error: Email provider rejected the request \(401\)$/);
});
