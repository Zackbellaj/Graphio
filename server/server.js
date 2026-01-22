const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow CORS from anywhere (or restrict to your frontend URL later)
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('RawGraphs Clone API is Running');
});

app.post('/api/save', (req, res) => {
    const projectData = req.body;
    const fileName = `project_${Date.now()}.json`;
    
    // NOTE: Vercel is Read-Only. You cannot write files to disk here.
    // In a real app, you would save 'projectData' to a database (MongoDB/Postgres).
    console.log(`[Mock Save] Project: ${fileName}`);
    console.log(projectData);

    res.json({ message: 'Project saved (Mock)', id: fileName });
});

// Vercel requires exporting the app
module.exports = app;

// Only listen if running locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}