// redisClient.js
const Redis = require('ioredis');

const redis = new Redis('redis://default:SZ6TgPWH3Qs2CI5Z3Uoo0KIdHbWX302k@redis-19125.c84.us-east-1-2.ec2.redns.redis-cloud.com:19125');

redis.on('connect', () => console.log('🔌 Connected to Redis Cloud'));
redis.on('error', err => console.error('❌ Redis error:', err));

module.exports = redis;
