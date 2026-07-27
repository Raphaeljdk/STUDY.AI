import ZAI from 'z-ai-web-dev-sdk';

const ZAI_CONFIG = {
  baseUrl: 'https://internal-api.z.ai/v1',
  apiKey: 'Z.ai',
  chatId: 'chat-f6c57963-c06e-48ac-8ed6-6d9b5412a056',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWM2MzI4MTMtMmYzZi00MmMxLTg2YzUtMGQ4ZmQyYWYzMjUyIiwiY2hhdF9pZCI6ImNoYXQtZjZjNTc5NjMtYzA2ZS00OGFjLThlZDYtNmQ5YjU0MTJhMDU2IiwicGxhdGZvcm0iOiJ6YWkifQ.omWZ85oH_mUYWoptr5ZBzXVx1MZOqMtTrkyabVQnJ9Q',
  userId: '1c632813-2f3f-42c1-86c5-0d8fd2af3252',
};

let zaiInstance: InstanceType<typeof ZAI> | null = null;

export async function getZAI(): Promise<InstanceType<typeof ZAI>> {
  if (!zaiInstance) {
    zaiInstance = new ZAI(ZAI_CONFIG);
  }
  return zaiInstance;
}
