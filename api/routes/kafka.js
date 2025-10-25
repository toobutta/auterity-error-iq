const express = require('express');
const { Kafka } = require('kafkajs');

const router = express.Router();

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'auterity-api',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'auterity-group' });

// Initialize producer and consumer
const initKafka = async () => {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'analytics-data', fromBeginning: true });

  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Received message: ${message.value.toString()}`);
      // Process message and insert into ClickHouse
      // TODO: Add ClickHouse insertion logic
    },
  });
};

initKafka().catch(console.error);

// Produce message to Kafka
router.post('/produce', async (req, res) => {
  const { topic, message } = req.body;

  if (!topic || !message) {
    return res.status(400).json({ error: 'Topic and message are required' });
  }

  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    res.status(200).json({ status: 'Message sent' });
  } catch (error) {
    console.error('Kafka produce error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
