import express from "express";

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = "PASTE_DISCORD_WEBHOOK_HERE";

app.post("/shopify-paid", async (req, res) => {
  const order = req.body;

  const price = `${order.currency || "USD"} ${order.total_price}`;
  const note = order.note || "No note";
  const time = order.processed_at || order.created_at || new Date().toISOString();

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "✅ New Paid Shopify Order",
        color: 5763719,
        fields: [
          { name: "Price", value: price, inline: true },
          { name: "Date/Time", value: time, inline: true },
          { name: "Note", value: note, inline: false }
        ]
      }]
    })
  });

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => console.log("Running"));