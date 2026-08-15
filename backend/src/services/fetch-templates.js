import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const apiUrl = 'https://graph.facebook.com/v20.0';

const fetchTemplates = async () => {
  try {
    console.log('Querying /me/businesses...');
    const res = await axios.get(`${apiUrl}/me/businesses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Businesses Response:', JSON.stringify(res.data, null, 2));

    for (const biz of res.data.data) {
      console.log(`\nQuerying whatsapp business accounts for Business ID: ${biz.id}...`);
      const wabaRes = await axios.get(`${apiUrl}/${biz.id}/whatsapp_business_accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('WABA Accounts:', JSON.stringify(wabaRes.data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

fetchTemplates();
