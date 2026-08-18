// src/dev-server.ts
import app from './app';
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Local server running on port ${PORT}`));