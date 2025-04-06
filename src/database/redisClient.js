require("dotenv").config({ path: "/app/src/.env" });
const { createClient } = require("redis");

console.log(process.env.REDIS_HOST)

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
