require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");

const sendSMS = async ({ sender, receiver, msg }) => {
  const form = new FormData();
  form.append("key", process.env.ALIGO_API_KEY);
  form.append("user_id", process.env.ALIGO_USER_ID);
  form.append("sender", sender);
  form.append("receiver", receiver);
  form.append("msg", msg);
  form.append("msg_type", "SMS");
  form.append("testmode_yn", "N");

  const response = await axios.post("https://apis.aligo.in/send/", form, {
    headers: form.getHeaders(),
  });

  return response.data;
};

module.exports = { sendSMS };
