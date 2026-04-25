


import app from "./app.js";
import config from "./config/index.js";


export default app;

// Local development 
if (process.env.NODE_ENV !== "production") {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}