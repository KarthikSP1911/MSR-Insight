import app from "./src/app.js";
import { startWeeklyCron } from "./src/cron.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startWeeklyCron(); // Register weekly attendance email digest
});
