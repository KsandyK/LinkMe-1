import express from 'express';
import securityMiddleware from './middleware/security.js';
import monetizationRoutes from './routes/monetization.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(securityMiddleware);
app.use('/api', monetizationRoutes);

app.get('/', (req, res) => {
  res.send(' LinkMe API is running!');
});

app.listen(PORT, () => {
  console.log(`LinkMe API running on http://localhost:${PORT}`);
});
