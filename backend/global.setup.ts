import fs from 'fs';
import { test as setup } from '@playwright/test';

const API_URL = 'http://localhost/api';
process.env.API_URL = API_URL;
const authAdminFile = 'playwright/.auth/admin.json';
const [admin, user] = JSON.parse(fs.readFileSync('./users.json', 'utf8'));

setup('Авторизация, как админ', async ({ request }) => {
  try {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: admin.email,
        password: admin.password,
      },
    });

    if (response.status() !== 200) {
      throw new Error(`Авторизация не удалась: ${response.status()} ${response.statusText()}`);
    }

    const { accessToken } = await response.json();
    process.env.ADMIN_TOKEN = accessToken;
    await request.storageState({ path: authAdminFile });
  } catch (error) {
    console.error(error);
    throw error;
  }
});

const authUserFile = 'playwright/.auth/user.json';

setup('Авторизация, как пользователь', async ({ request }) => {
  try {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: user.email,
        password: user.password,
      },
    });

    if (response.status() !== 200) {
      throw new Error(`Авторизация не удалась: ${response.status()} ${response.statusText()}`);
    }

    const { accessToken } = await response.json();
    process.env.USER_TOKEN = accessToken;
    await request.storageState({ path: authUserFile });
  } catch (error) {
    console.error(error);
    throw error;
  }
});
