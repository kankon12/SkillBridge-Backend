// import app from "./app.js";
// import config from "./config/index.js"

// async function main() {
//   try {
//     app.listen(config.port, () => {
//       console.log(`Example app listening on port ${config.port}`);
//     });
//   } catch (err) {
//     console.log(err);
//   }
// }

// main();


import app from "./app.js";
import config from "./config/index.js";


export default app;

// Local development এর জন্য
if (process.env.NODE_ENV !== "production") {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}