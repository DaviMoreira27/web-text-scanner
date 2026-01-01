import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "website-scraper",
  brokers: ["172.21.0.3:9092"],
});

export const consumer = kafka.consumer({
  groupId: "scraping-group",
});
