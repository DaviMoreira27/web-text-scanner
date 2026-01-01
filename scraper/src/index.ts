import { writeFile } from "fs/promises";
import { consumer } from "./queue/queue.config.ts";
import { scrapePage } from "./scraper/scraper.service.ts";

console.log(`Hello World`);

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "website-scraper", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log("Reading message", {
        partition,
        offset: message.offset,
        value: message.value.toString(),
      });

      const buffer = await scrapePage(message.value.toString());

      await writeFile(`./images/image-${message.offset}.png`, buffer);
    },
  });
};

run().catch(console.error);
